import assert from "node:assert/strict";
import { test } from "node:test";
import {
  adapterConfigured,
  buildChatCompletion,
  toSseStream,
  verifyAdapterToken,
  ADAPTER_MODEL_NAME,
  type ChatMessage,
} from "./agentic-llm-adapter";

const okTask = async (messages: ChatMessage[]) =>
  `reply to ${messages.length} messages`;

test("verifyAdapterToken accepts the exact bearer token", () => {
  assert.equal(verifyAdapterToken("Bearer s3cret", "s3cret"), true);
});

test("verifyAdapterToken rejects wrong, missing and malformed tokens", () => {
  assert.equal(verifyAdapterToken("Bearer wrong", "s3cret"), false);
  assert.equal(verifyAdapterToken(undefined, "s3cret"), false);
  assert.equal(verifyAdapterToken("Bearer", "s3cret"), false);
  assert.equal(verifyAdapterToken("Basic s3cret", "s3cret"), false);
  // Same prefix, different length must not throw (timingSafeEqual length guard).
  assert.equal(verifyAdapterToken("Bearer s3cret-longer", "s3cret"), false);
});

test("buildChatCompletion returns an OpenAI-shaped completion", async () => {
  const result = await buildChatCompletion(
    {
      messages: [
        { role: "system", content: "be helpful" },
        { role: "user", content: "hi" },
      ],
    },
    okTask,
  );
  assert.equal(result.object, "chat.completion");
  assert.equal(result.model, ADAPTER_MODEL_NAME);
  assert.equal(result.choices.length, 1);
  assert.equal(result.choices[0].message.role, "assistant");
  assert.equal(result.choices[0].message.content, "reply to 2 messages");
  assert.equal(result.choices[0].finish_reason, "stop");
  assert.ok(result.id.startsWith("chatcmpl-agenticorg-"));
});

test("buildChatCompletion rejects missing or malformed messages", async () => {
  await assert.rejects(() => buildChatCompletion({}, okTask), /non-empty messages/);
  await assert.rejects(
    () => buildChatCompletion({ messages: [] }, okTask),
    /non-empty messages/,
  );
  await assert.rejects(
    () =>
      buildChatCompletion(
        { messages: [{ role: "tool", content: "x" }] },
        okTask,
      ),
    /messages\[0\]/,
  );
  await assert.rejects(
    () =>
      buildChatCompletion(
        { messages: [{ role: "user", content: 42 }] as never },
        okTask,
      ),
    /messages\[0\]/,
  );
});

test("toSseStream emits one content chunk, a stop chunk and [DONE]", async () => {
  const completion = await buildChatCompletion(
    { messages: [{ role: "user", content: "hi" }] },
    okTask,
  );
  const sse = toSseStream(completion);
  const frames = sse.trim().split("\n\n");
  assert.equal(frames.length, 3);
  const first = JSON.parse(frames[0].replace(/^data: /, ""));
  assert.equal(first.object, "chat.completion.chunk");
  assert.equal(first.choices[0].delta.content, "reply to 1 messages");
  assert.equal(first.choices[0].finish_reason, null);
  const second = JSON.parse(frames[1].replace(/^data: /, ""));
  assert.equal(second.choices[0].finish_reason, "stop");
  assert.equal(frames[2], "data: [DONE]");
});

test("adapterConfigured is false until all four secrets exist", () => {
  const saved = { ...process.env };
  delete process.env.ADAPTER_SHARED_TOKEN;
  delete process.env.AGENTICORG_URL;
  delete process.env.AGENTICORG_KEY;
  delete process.env.AGENTICORG_AGENT_UUID;
  assert.equal(adapterConfigured(), false);
  process.env.ADAPTER_SHARED_TOKEN = "t";
  assert.equal(adapterConfigured(), false);
  process.env.AGENTICORG_URL = "https://agenticorg.invalid/api/v1";
  assert.equal(adapterConfigured(), false);
  process.env.AGENTICORG_KEY = "k";
  assert.equal(adapterConfigured(), false);
  process.env.AGENTICORG_AGENT_UUID = "u";
  assert.equal(adapterConfigured(), true);
  for (const key of ["ADAPTER_SHARED_TOKEN", "AGENTICORG_URL", "AGENTICORG_KEY", "AGENTICORG_AGENT_UUID"]) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});
