import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useChatWithCareerRoleMentor } from '@workspace/api-client-react';
import { ArrowUp, Bot, Lightbulb, LoaderCircle, Mic, RefreshCw, Sparkles } from 'lucide-react';

type Msg = { role: 'user' | 'assistant'; content: string };
const MAX_INPUT = 1500;
const MAX_ASSISTANT = 6000;

const starterPrompts = [
  'What does a typical week look like?',
  'What should I try before committing to this path?',
  'What surprised you most in this role?',
];

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

  const sendPrompt = (prompt: string) => {
    if (inFlight.current || chat.isPending || failed) return;
    const next: Msg[] = [...messages, { role: 'user', content: prompt }];
    setMessages(next);
    request(next);
  };
  const retry = () => request(messages);
  const busy = chat.isPending && !failed;

  return <section className="mt-8 overflow-hidden rounded-[2rem] border border-primary/15 bg-card shadow-[0_24px_65px_-42px_hsl(var(--primary)/.46)]" data-testid="section-role-mentor-chat" aria-label="Talk to the mentor">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border/75 bg-[linear-gradient(110deg,hsl(var(--secondary)/.62),hsl(var(--card))_52%,hsl(var(--background)/.7))] px-5 py-5 sm:px-7">
      <div className="flex min-w-0 items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[0_10px_22px_-13px_hsl(var(--primary)/.9)]"><Bot size={21} strokeWidth={1.8} /></div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1"><h2 className="serif text-3xl leading-none sm:text-[2rem]">Your {roleTitle} mentor</h2><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[.12em] text-emerald-800"><span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> Ready</span></div>
          <p className="mt-1.5 text-xs leading-5 text-muted-foreground">An AI role-play grounded in this career guide.</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2" data-slot="voice-control">
        <span className="hidden text-xs text-muted-foreground sm:inline">Voice agent</span>
        <button type="button" disabled title="Voice agent coming soon" className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card px-3 text-xs font-semibold text-muted-foreground opacity-80 disabled:cursor-not-allowed"><Mic size={14} /> <span className="sm:hidden">Voice</span><span className="hidden sm:inline">Coming soon</span></button>
      </div>
    </header>

    <div className="p-4 sm:p-6">
      <div className="relative max-h-[520px] min-h-[350px] overflow-y-auto rounded-[1.45rem] border border-border/70 bg-background/55 px-4 py-5 sm:px-6" data-testid="list-mentor-messages" role="log" aria-live="polite">
        {messages.length === 0 && <div className="flex min-h-[300px] flex-col items-center justify-center py-8 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Sparkles size={24} /></div>
          <p className="serif mt-5 max-w-sm text-3xl leading-tight">Let’s make this role feel real.</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">Ask about the work, the trade-offs, or a small way to test whether it suits you.</p>
          <div className="mt-7 flex max-w-xl flex-wrap justify-center gap-2" aria-label="Suggested questions">
            {starterPrompts.map((prompt) => <button key={prompt} type="button" onClick={() => sendPrompt(prompt)} disabled={busy || failed} className="rounded-full border border-primary/20 bg-card px-3.5 py-2 text-left text-xs font-medium text-primary transition hover:-translate-y-0.5 hover:border-primary/45 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50">{prompt}</button>)}
          </div>
        </div>}
        {messages.map((m, i) => <div key={i} className={`mb-5 flex items-end gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`} data-testid={`message-${m.role}-${i}`}>
          {m.role === 'assistant' && <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground"><Bot size={15} /></div>}
          <div className={`max-w-[87%] whitespace-pre-wrap break-words rounded-[1.25rem] px-4 py-3 text-sm leading-6 shadow-sm sm:max-w-[78%] ${m.role === 'user' ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md border border-border/80 bg-card text-card-foreground'}`}>
            <span className={`mono mb-1.5 block text-[9px] uppercase tracking-[.13em] ${m.role === 'user' ? 'text-primary-foreground/65' : 'text-muted-foreground'}`}>{m.role === 'user' ? 'You' : 'Mentor'}</span>{m.content}
          </div>
        </div>)}
        {busy && <div className="mb-4 flex items-end gap-2.5" data-testid="status-mentor-sending"><div className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground"><Bot size={15} /></div><div className="flex items-center gap-2 rounded-[1.25rem] rounded-bl-md border border-border bg-card px-4 py-3 text-sm text-muted-foreground"><LoaderCircle className="animate-spin text-primary" size={15} /> Thinking through it…</div></div>}
        <div ref={endRef} />
      </div>

      {failed && <div role="alert" className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" data-testid="status-mentor-error">
        <span>The mentor couldn’t reply just now. Your message is still here.</span>
        <button type="button" onClick={retry} className="inline-flex items-center gap-2 rounded-full border border-red-300 bg-white px-4 py-2 text-xs font-semibold transition hover:bg-red-100" data-testid="button-mentor-retry"><RefreshCw size={13} /> Retry</button>
      </div>}

      <form onSubmit={send} className="mt-4 rounded-[1.45rem] border border-border bg-card p-2 shadow-[0_8px_24px_-18px_hsl(var(--foreground)/.3)]">
        <label className="block"><span className="sr-only">Your message to the mentor</span>
          <textarea data-testid="input-mentor-chat" rows={2} maxLength={MAX_INPUT} value={input} onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Message your mentor…" className="block w-full resize-none bg-transparent px-3 py-2 text-sm leading-6 outline-none placeholder:text-muted-foreground/75" />
        </label>
        <div className="flex items-center justify-between gap-3 px-1 pb-1">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"><Lightbulb size={13} className="text-accent" /> Enter to send <span className="hidden sm:inline">· Shift + Enter for a new line</span></span>
          <div className="flex items-center gap-2"><span className="mono hidden text-[10px] text-muted-foreground sm:inline">{input.length}/{MAX_INPUT}</span><button type="submit" disabled={!input.trim() || busy || failed} data-testid="button-mentor-send" className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground transition hover:-translate-y-0.5 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-45" aria-label="Send message">
            {busy ? <LoaderCircle className="animate-spin" size={17} /> : <ArrowUp size={18} strokeWidth={2.3} />}
          </button></div>
        </div>
      </form>
      <p className="px-2 pt-3 text-center text-[11px] leading-5 text-muted-foreground">Illustrative guidance, not a real person or a guarantee. This conversation stays only while you’re on this page.</p>
    </div>
  </section>;
}
