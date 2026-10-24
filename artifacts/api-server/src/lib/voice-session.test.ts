import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mintVoiceSessionUrl,
  voiceAvailable,
  voiceConfigured,
  VoiceConfigError,
} from "./voice-session";

function withEnv(env: Record<string, string | undefined>, fn: () => void) {
  const saved = { ...process.env };
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    fn();
  } finally {
    for (const k of Object.keys(env)) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
}

test("voiceConfigured requires both secrets", () => {
  withEnv({ ELEVENLABS_API_KEY: undefined, ELEVENLABS_AGENT_ID: undefined }, () => {
    assert.equal(voiceConfigured(), false);
  });
  withEnv({ ELEVENLABS_API_KEY: "k", ELEVENLABS_AGENT_ID: undefined }, () => {
    assert.equal(voiceConfigured(), false);
  });
  withEnv({ ELEVENLABS_API_KEY: "k", ELEVENLABS_AGENT_ID: "a" }, () => {
    assert.equal(voiceConfigured(), true);
  });
});

test("voiceAvailable needs both secrets and VOICE_VERIFIED=true", () => {
  withEnv({ ELEVENLABS_API_KEY: "k", ELEVENLABS_AGENT_ID: "a", VOICE_VERIFIED: undefined }, () => {
    assert.equal(voiceAvailable(), false);
  });
  withEnv({ ELEVENLABS_API_KEY: undefined, ELEVENLABS_AGENT_ID: "a", VOICE_VERIFIED: "true" }, () => {
    assert.equal(voiceAvailable(), false);
  });
  withEnv({ ELEVENLABS_API_KEY: "k", ELEVENLABS_AGENT_ID: "a", VOICE_VERIFIED: "true" }, () => {
    assert.equal(voiceAvailable(), true);
  });
});

test("mintVoiceSessionUrl throws a visible error when unconfigured", async () => {
  const saved = { ...process.env };
  delete process.env.ELEVENLABS_API_KEY;
  delete process.env.ELEVENLABS_AGENT_ID;
  await assert.rejects(
    () => mintVoiceSessionUrl(),
    (err: unknown) =>
      err instanceof VoiceConfigError && /not configured/.test(err.expose) && !/ELEVENLABS_/.test(err.expose),
  );
  for (const k of ["ELEVENLABS_API_KEY", "ELEVENLABS_AGENT_ID"]) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

test("mintVoiceSessionUrl returns the signed URL from ElevenLabs", async () => {
  const saved = { ...process.env };
  process.env.ELEVENLABS_API_KEY = "k";
  process.env.ELEVENLABS_AGENT_ID = "agent_123";
  const calls: string[] = [];
  const fakeFetch = async (url: unknown) => {
    calls.push(String(url));
    return new Response(JSON.stringify({ signed_url: "wss://signed.example/abc" }), {
      status: 200,
    });
  };
  const url = await mintVoiceSessionUrl(fakeFetch as typeof fetch);
  assert.equal(url, "wss://signed.example/abc");
  assert.ok(calls[0].includes("agent_id=agent_123"));
  for (const k of ["ELEVENLABS_API_KEY", "ELEVENLABS_AGENT_ID"]) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

test("mintVoiceSessionUrl surfaces an ElevenLabs refusal", async () => {
  const saved = { ...process.env };
  process.env.ELEVENLABS_API_KEY = "k";
  process.env.ELEVENLABS_AGENT_ID = "agent_123";
  const fakeFetch = async () => new Response("nope", { status: 401 });
  await assert.rejects(
    () => mintVoiceSessionUrl(fakeFetch as typeof fetch),
    /HTTP 401/,
  );
  for (const k of ["ELEVENLABS_API_KEY", "ELEVENLABS_AGENT_ID"]) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});
