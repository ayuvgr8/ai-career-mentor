/**
 * ElevenLabs voice session helper (server-side only).
 *
 * Mints a single-use signed conversation URL for the configured ElevenLabs
 * agent so the browser can open a WebRTC voice session without ever seeing
 * the API key. The key stays in server secrets (ELEVENLABS_API_KEY).
 *
 * Gating: if ELEVENLABS_API_KEY or ELEVENLABS_AGENT_ID is unset, the feature
 * is simply not configured and callers get a visible 503 - nothing falls
 * back and nothing is spent.
 *
 * API shape per ElevenLabs docs (GET /v1/convai/conversation/get-signed-url
 * ?agent_id=...). Verified against docs, not against a live call yet.
 */

const ELEVENLABS_API = "https://api.elevenlabs.io";

export class VoiceConfigError extends Error {
  constructor(readonly expose: string) {
    super(expose);
    this.name = "VoiceConfigError";
  }
}

export function voiceConfigured(): boolean {
  return Boolean(
    process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_AGENT_ID,
  );
}

/**
 * Entry points (nav, role-chat button) stay hidden until the owner has run
 * one real voice conversation end to end and set VOICE_VERIFIED=true. The
 * /voice page itself still works once configured, so it can be tested.
 */
export function voiceAvailable(): boolean {
  return voiceConfigured() && process.env.VOICE_VERIFIED === "true";
}

type FetchLike = typeof fetch;

export async function mintVoiceSessionUrl(
  fetchImpl: FetchLike = fetch,
): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!apiKey || !agentId) {
    throw new VoiceConfigError(
      "Voice mentor is not configured yet - the site owner still needs to finish the voice setup.",
    );
  }

  const response = await fetchImpl(
    `${ELEVENLABS_API}/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`,
    { headers: { "xi-api-key": apiKey } },
  );
  if (!response.ok) {
    throw new VoiceConfigError(
      `The voice service refused the session request (HTTP ${response.status}).`,
    );
  }
  const body = (await response.json()) as { signed_url?: unknown };
  if (typeof body.signed_url !== "string" || !body.signed_url) {
    throw new VoiceConfigError("ElevenLabs returned no signed URL.");
  }
  return body.signed_url;
}
