/**
 * Voice mentor session route.
 *
 * GET /api/voice/status  -> { available } (public; no secrets)
 * GET /api/voice/session -> { signedUrl }
 *
 * Access and usage controls:
 * - Session-bound: only a signed-in user can mint a voice session, so the
 *   ElevenLabs agent minutes cannot be burned anonymously.
 * - Per-user cooldown: one mint per MINT_COOLDOWN_MS per user id, in-memory.
 *   This is a light guard against accidental double-clicks and casual abuse,
 *   not a hard quota - it resets on server restart and does not span
 *   multiple server instances.
 * - The ElevenLabs API key never leaves the server.
 */
import { Router, type IRouter, type Request, type Response } from "express";
import {
  mintVoiceSessionUrl,
  voiceAvailable,
  VoiceConfigError,
} from "../lib/voice-session";

const router: IRouter = Router();

const MINT_COOLDOWN_MS = 30_000;
const lastMintByUser = new Map<string, number>();

router.get("/voice/status", (_req: Request, res: Response) => {
  res.json({ available: voiceAvailable() });
});

router.get("/voice/session", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Sign in to continue." });
    return;
  }
  const userId = String(req.user.id);
  const last = lastMintByUser.get(userId) ?? 0;
  const waitMs = last + MINT_COOLDOWN_MS - Date.now();
  if (waitMs > 0) {
    res.status(429).json({
      error: `One voice session at a time - try again in ${Math.ceil(waitMs / 1000)} seconds.`,
    });
    return;
  }
  try {
    const signedUrl = await mintVoiceSessionUrl();
    lastMintByUser.set(userId, Date.now());
    res.json({ signedUrl });
  } catch (err) {
    if (err instanceof VoiceConfigError) {
      res.status(503).json({ error: err.expose });
      return;
    }
    res.status(502).json({ error: "Voice service is unreachable right now. Try again in a moment." });
  }
});

export default router;
