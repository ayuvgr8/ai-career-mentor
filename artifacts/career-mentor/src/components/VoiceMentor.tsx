import { useCallback, useRef, useState } from 'react';
import { useConversation } from '@elevenlabs/react';
import { LoaderCircle, Mic, MicOff, PhoneOff } from 'lucide-react';

type Line = { source: 'user' | 'agent'; text: string };
export type VoiceState = 'idle' | 'starting' | 'connected' | 'error';

async function fetchSignedUrl(): Promise<string> {
  const response = await fetch('/api/voice/session', { credentials: 'include' });
  if (response.status === 401) throw new Error('sign-in');
  if (response.status === 503) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || 'Voice mentor is not configured yet.');
  }
  if (response.status === 429) {
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error || 'One voice session at a time - try again shortly.');
  }
  if (!response.ok) throw new Error('Voice service is unreachable right now.');
  const data = (await response.json()) as { signedUrl?: string };
  if (!data.signedUrl) throw new Error('Voice service returned no session.');
  return data.signedUrl;
}

export type VoiceMentorViewProps = {
  state: VoiceState;
  connected: boolean;
  speaking: boolean;
  error: string;
  lines: Line[];
  onStart: () => void;
  onStop: () => void;
};

export function VoiceMentorView({ state, connected, speaking, error, lines, onStart, onStop }: VoiceMentorViewProps) {
  return (
    <section className="rounded-[1.8rem] border border-border bg-card p-6 sm:p-8" data-testid="section-voice-mentor">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground"><Mic size={18} /></div>
        <div>
          <p className="mono text-[9px] uppercase tracking-[.16em] text-primary">Talk it through</p>
          <h2 className="serif mt-1 text-3xl" data-testid="text-voice-title">Voice mentor</h2>
        </div>
      </div>
      <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
        A spoken conversation with Mentor in Hinglish. Your voice is sent to ElevenLabs
        to run the conversation, and ElevenLabs processes the transcript.
      </p>

      {error && (
        <div role="alert" className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" data-testid="alert-voice-error">{error}</div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {!connected ? (
          <button
            type="button"
            onClick={onStart}
            disabled={state === 'starting'}
            data-testid="button-voice-start"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_8px_22px_-12px_hsl(var(--primary)/.55)] transition-all duration-200 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {state === 'starting' ? <><LoaderCircle className="animate-spin" size={16} /> Connecting…</> : <><Mic size={16} /> Start voice conversation</>}
          </button>
        ) : (
          <button
            type="button"
            onClick={onStop}
            data-testid="button-voice-stop"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[hsl(var(--destructive))] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <PhoneOff size={16} /> End conversation
          </button>
        )}
        {connected && (
          <span className="mono inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-2 text-xs text-foreground" data-testid="text-voice-status">
            {speaking ? <MicOff size={13} className="text-primary" /> : <Mic size={13} className="text-primary" />}
            {speaking ? 'Mentor is speaking' : 'Listening - your turn'}
          </span>
        )}
      </div>

      {lines.length > 0 && (
        <div className="mt-6 space-y-3" data-testid="list-voice-transcript">
          {lines.map((line, index) => (
            <div key={index} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${line.source === 'user' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-secondary/70 text-foreground'}`}>
              {line.text}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function VoiceMentor() {
  const [state, setState] = useState<VoiceState>('idle');
  const [error, setError] = useState('');
  const [lines, setLines] = useState<Line[]>([]);
  const alive = useRef(true);

  const conversation = useConversation({
    onMessage: (event: { message?: string; source?: string }) => {
      const text = typeof event.message === 'string' ? event.message.trim() : '';
      if (!text || !alive.current) return;
      const source = event.source === 'user' ? 'user' : 'agent';
      setLines((prev) => [...prev.slice(-40), { source, text }]);
    },
    onError: () => {
      if (!alive.current) return;
      setState('error');
      setError('The voice connection dropped. You can start it again.');
    },
  });

  const start = useCallback(async () => {
    setError('');
    setLines([]);
    setState('starting');
    try {
      const signedUrl = await fetchSignedUrl();
      // signedUrl selects a WebSocket connection in the ElevenLabs client
      // (their get-signed-url endpoint supports WebSocket transport only).
      await conversation.startSession({ signedUrl });
      if (alive.current) setState('connected');
    } catch (err) {
      if (!alive.current) return;
      const message = err instanceof Error ? err.message : '';
      if (message === 'sign-in') {
        setError('Sign in first, then start the voice mentor.');
      } else if (/denied|permission|notallowed/i.test(message)) {
        setError('Microphone access was blocked. Allow the mic in your browser and try again.');
      } else {
        setError(message || 'Could not start the voice mentor.');
      }
      setState('error');
    }
  }, [conversation]);

  const stop = useCallback(async () => {
    try {
      await conversation.endSession();
    } finally {
      if (alive.current) setState('idle');
    }
  }, [conversation]);

  const connected = state === 'connected' && conversation.status === 'connected';
  const speaking = connected && conversation.isSpeaking;

  return (
    <VoiceMentorView
      state={state}
      connected={connected}
      speaking={speaking}
      error={error}
      lines={lines}
      onStart={start}
      onStop={stop}
    />
  );
}
