/**
 * OpenAI-compatible endpoint for ElevenLabs Custom LLM.
 *
 * POST /api/agentic-llm/chat/completions
 *
 * Bearer-token protected (ADAPTER_SHARED_TOKEN) and disabled by default:
 * without that secret the route answers 503, so anonymous traffic can never
 * trigger AgenticOrg runs. No user session is involved - the caller is the
 * ElevenLabs backend, not a browser.
 */
import { Router, type IRouter, type Request, type Response } from "express";
import {
  adapterConfigured,
  AdapterConfigError,
  buildChatCompletion,
  toSseStream,
  verifyAdapterToken,
  type ChatCompletionsBody,
} from "../lib/agentic-llm-adapter";
import { AgenticOrgError } from "../lib/agenticorg";

const router: IRouter = Router();

router.post(
  "/agentic-llm/chat/completions",
  async (req: Request, res: Response) => {
    if (!adapterConfigured()) {
      res.status(503).json({
        error: {
          message:
            "The AgenticOrg LLM adapter is not configured yet (ADAPTER_SHARED_TOKEN / AGENTICORG_* secrets missing).",
          type: "adapter_not_configured",
        },
      });
      return;
    }
    if (
      !verifyAdapterToken(
        req.headers.authorization,
        process.env.ADAPTER_SHARED_TOKEN as string,
      )
    ) {
      res.status(401).json({
        error: { message: "Unauthorized.", type: "invalid_api_key" },
      });
      return;
    }

    const body = (req.body ?? {}) as ChatCompletionsBody;
    try {
      const completion = await buildChatCompletion(body);
      if (body.stream === true) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.send(toSseStream(completion));
        return;
      }
      res.json(completion);
    } catch (err) {
      if (err instanceof AdapterConfigError) {
        res.status(400).json({ error: { message: err.expose, type: "invalid_request" } });
        return;
      }
      if (err instanceof AgenticOrgError) {
        res.status(502).json({
          error: { message: `Mentor backend failed: ${err.message}`, type: "upstream_error" },
        });
        return;
      }
      res.status(500).json({ error: { message: "Adapter error.", type: "server_error" } });
    }
  },
);

export default router;
