import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useChatWithCareerRoleMentor } from '@workspace/api-client-react';
import { LoaderCircle, MessageCircle, RefreshCw, Send } from 'lucide-react';

type Msg = { role: 'user' | 'assistant'; content: string };
const MAX_INPUT = 1500;
const MAX_ASSISTANT = 6000;

export function RoleMentorChat({ slug, roleTitle }: { slug: string; roleTitle: string }) {
  const chat = useChatWithCareerRoleMentor();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [failed, setFailed] = useState(false);
  const inFlight = useRef(false);
  const mutateRef = useRef(chat.mutate);
  mutateRef.current = chat.mutate;
  const endRef = useRef<HTMLDivElement>(null);
  const alive = useRef(true);
  const slugRef = useRef(slug);
  slugRef.current = slug;

  useEffect(() => {
    setMessages([]); setInput(''); setFailed(false); inFlight.current = false;
  }, [slug]);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => { endRef.current?.scrollIntoView?.({ block: 'nearest' }); }, [messages, failed]);

  const request = (history: Msg[]) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setFailed(false);
    const requestSlug = slug;
    const payload = history.slice(-12);
    mutateRef.current({ slug, data: { messages: payload } }, {
      onSuccess: (result) => {
        if (!alive.current || slugRef.current !== requestSlug) return;
        inFlight.current = false;
        setMessages((prev) => [...prev, { role: 'assistant', content: String(result.reply).slice(0, MAX_ASSISTANT) }]);
      },
      onError: () => {
        if (!alive.current || slugRef.current !== requestSlug) return;
        inFlight.current = false;
        setFailed(true);
      },
    });
  };

  const send = (event?: FormEvent) => {
    event?.preventDefault();
    const text = input.trim();
    if (!text || inFlight.current || chat.isPending || failed) return;
    const next: Msg[] = [...messages, { role: 'user', content: text.slice(0, MAX_INPUT) }];
    setMessages(next);
    setInput('');
    request(next);
  };
  const retry = () => request(messages);
  const busy = chat.isPending && !failed;

  return <section className="mt-8 rounded-[1.8rem] border border-border bg-card p-5 sm:p-8" data-testid="section-role-mentor-chat" aria-label="Talk to the mentor">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="mono text-[9px] uppercase tracking-[.18em] text-primary">Role-play conversation</p>
        <h2 className="serif mt-2 text-4xl">Talk to the mentor</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">An illustrative AI role-play of someone in the {roleTitle} role, grounded in the same brief above. It is not a real person, and its answers are examples rather than guarantees. This chat is kept only while you stay on this page.</p>
      </div>
      {/* Reserved slot for a future voice control; intentionally empty and hidden. */}
      <div className="hidden" aria-hidden="true" data-slot="voice-control" />
    </div>
    <div className="mt-5 max-h-[420px] min-h-[160px] space-y-3 overflow-y-auto rounded-2xl bg-background/60 p-4" data-testid="list-mentor-messages" role="log" aria-live="polite">
      {messages.length === 0 && <div className="grid min-h-[128px] place-items-center text-center text-sm text-muted-foreground"><div><MessageCircle className="mx-auto mb-2 text-primary" size={20} />Ask what a normal week feels like, what surprises people, or what to try first.</div></div>}
      {messages.map((m, i) => <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`} data-testid={`message-${m.role}-${i}`}>
        <div className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-6 ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'border border-border bg-card'}`}>
          <span className="mono mb-1 block text-[9px] uppercase tracking-[.14em] opacity-70">{m.role === 'user' ? 'You' : 'Mentor (illustrative)'}</span>{m.content}
        </div>
      </div>)}
      {busy && <div className="flex justify-start" data-testid="status-mentor-sending"><div className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground"><LoaderCircle className="animate-spin" size={14} /> The mentor is replying…</div></div>}
      <div ref={endRef} />
    </div>
    {failed && <div role="alert" className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" data-testid="status-mentor-error">
      <span>The mentor couldn’t reply just now. Your message is saved here.</span>
      <button type="button" onClick={retry} className="inline-flex items-center gap-2 rounded-full border border-red-300 bg-white px-4 py-2 text-xs font-semibold" data-testid="button-mentor-retry"><RefreshCw size={13} /> Retry</button>
    </div>}
    <form onSubmit={send} className="mt-4 flex items-end gap-3">
      <label className="block flex-1"><span className="sr-only">Your message</span>
        <textarea data-testid="input-mentor-chat" rows={2} maxLength={MAX_INPUT} value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask the mentor something…" className="w-full resize-none rounded-2xl border border-border bg-background/60 px-4 py-3 text-sm leading-6 focus:border-primary focus:outline-none" />
        <span className="mono mt-1 block text-right text-[10px] text-muted-foreground">{input.length} / {MAX_INPUT}</span>
      </label>
      <button type="submit" disabled={!input.trim() || busy || failed} data-testid="button-mentor-send" className="mb-6 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">
        {busy ? <LoaderCircle className="animate-spin" size={15} /> : <Send size={15} />} Send
      </button>
    </form>
  </section>;
}
