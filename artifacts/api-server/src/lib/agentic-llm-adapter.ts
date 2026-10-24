/**
 * OpenAI-compatible chat-completions adapter over the AgenticOrg run API.
 *
 * Why: ElevenLabs "Custom LLM" speaks the OpenAI chat-completions protocol
 * (https://elevenlabs.io/docs/eleven-agents/customization/llm/custom-llm),
 * while AgenticOrg exposes a request/response run endpoint. This adapter is
 * the only supported bridge between the two; the ElevenLabs agent's LLM is
 * pointed at this route once it is deployed and verified.
 *
 * Abuse protection: every call must carry `Authorization: Bearer
 * <ADAPTER_SHARED_TOKEN>`. The route is DISABLED (503) until that secret is
 * set, so an unconfigured deploy cannot be hit anonymously and run up
 * AgenticOrg usage. The token lives only in server secrets and in the
 * ElevenLabs Custom-LLM header config - never in the frontend.
 *
 * UNVERIFIED CONTRACT NOTE: the AgenticOrg run response schema has not been
 * confirmed against a live run. `runMentorTask` already extracts the reply
 * defensively; confirm the real payload shape in one smoke test after the
 * safe agent UUID is verified, then trim.
 */
import { createHash, timingSafeEqual } from "node:crypto";
import { runMentorTask, type ChatMessage } from "./agenticorg";

export type { ChatMessage };

export class AdapterAuthError extends Error {
  constructor() {
    super("Invalid or missing adapter token.");
    this.name = "AdapterAuthError";
  }
}

export class AdapterConfigError extends Error {
  constructor(readonly expose: string) {
    super(expose);
    this.name = "AdapterConfigError";
  }
}

export function adapterConfigured(): boolean {
  return Boolean(
    process.env.ADAPTER_SHARED_TOKEN &&
      process.env.AGENTICORG_URL &&
      process.env.AGENTICORG_KEY &&
      process.env.AGENTICORG_AGENT_UUID,
  );
}

/** Constant-time bearer check. Hash first so length differences do not leak. */
export function verifyAdapterToken(
  authorizationHeader: string | undefined,
  expectedToken: string,
): boolean {
  if (!authorizationHeader?.startsWith("Bearer ")) return false;
  const presented = authorizationHeader.slice(7);
  if (!presented) return false;
  const a = createHash("sha256").update(presented).digest();
  const b = createHash("sha256").update(expectedToken).digest();
  return timingSafeEqual(a, b);
}

export type ChatCompletionsBody = {
  messages?: { role?: unknown; content?: unknown }[];
  stream?: boolean;
  model?: unknown;
};

function normalizeMessages(body: ChatCompletionsBody): ChatMessage[] {
  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    throw new AdapterConfigError("Request must include a non-empty messages array.");
  }
  const messages: ChatMessage[] = [];
  for (const [index, m] of body.messages.entries()) {
    const role = m?.role;
    const content = m?.content;
    if (
      (role !== "system" && role !== "user" && role !== "assistant") ||
      typeof content !== "string"
    ) {
      throw new AdapterConfigError(
        `messages[${index}] must have role system|user|assistant and string content.`,
      );
    }
    messages.push({ role, content });
  }
  return messages;
}

export type ChatCompletionResult = {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: {
    index: number;
    message: { role: "assistant"; content: string };
    finish_reason: "stop";
  }[];
};

export const ADAPTER_MODEL_NAME = "agenticorg-mentor";

/**
 * Runs one completion. `runTask` is injectable so tests do not touch the
 * network; production passes the real AgenticOrg client.
 */
export async function buildChatCompletion(
  body: ChatCompletionsBody,
  runTask: (messages: ChatMessage[]) => Promise<string> = runMentorTask,
): Promise<ChatCompletionResult> {
  const messages = normalizeMessages(body);
  const content = await runTask(messages);
  return {
    id: `chatcmpl-agenticorg-${Date.now().toString(36)}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: ADAPTER_MODEL_NAME,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content },
        finish_reason: "stop",
      },
    ],
  };
}

/**
 * ElevenLabs requests streamed responses. AgenticOrg is request/response, so
 * the full reply is buffered, then emitted as one SSE delta followed by a
 * stop chunk and [DONE] - valid SSE that OpenAI-protocol clients accept.
 */
export function toSseStream(completion: ChatCompletionResult): string {
  const chunk = {
    id: completion.id,
    object: "chat.completion.chunk",
    created: completion.created,
    model: completion.model,
    choices: [
      {
        index: 0,
        delta: { role: "assistant", content: completion.choices[0].message.content },
        finish_reason: null,
      },
    ],
  };
  const end = {
    id: completion.id,
    object: "chat.completion.chunk",
    created: completion.created,
    model: completion.model,
    choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
  };
  return `data: ${JSON.stringify(chunk)}\n\ndata: ${JSON.stringify(end)}\n\ndata: [DONE]\n\n`;
}
