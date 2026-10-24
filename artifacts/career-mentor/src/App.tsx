import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { useAuth } from '@workspace/replit-auth-web';
import {
  useDeleteCareerProfile,
  useGenerateCareerRecommendations,
  useGetCareerProfile,
  useGetNextCareerQuestion,
  useParseCareerResume,
  useSaveCareerProfile,
  getGetCareerProfileQueryKey,
  type CareerProfileInput,
  type AnswerEntry,
  type NextQuestionResult,
  type RecommendationResult,
} from '@workspace/api-client-react';
import {
  ArrowLeft, ArrowRight, Check, ChevronRight, Compass, FileText, Heart, LoaderCircle,
  LockKeyhole, LogOut, MapPin, Menu, ShieldCheck, Sparkles, Trash2, X,
} from 'lucide-react';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

type Persona = 'student' | 'professional';
const emptyDraft = (): CareerProfileInput => ({
  name: '', city: '', ageBand: null, persona: 'student', currentStage: null, company: null,
  yearsExperience: null, internships: [], interests: [], energizers: [], chores: [],
  workStyle: '', preferredMake: '', strengths: [], constraints: [], familyExpectations: null,
  moneyNeeds: null, relocation: null,
});

function Button({ children, onClick, type = 'button', variant = 'primary', disabled, className = '', ...props }: {
  children: ReactNode; onClick?: () => void; type?: 'button' | 'submit'; variant?: 'primary' | 'quiet' | 'outline' | 'danger';
  disabled?: boolean; className?: string; [key: string]: unknown;
}) {
  const variants = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_8px_22px_-12px_hsl(var(--primary)/.55)]',
    quiet: 'bg-transparent text-foreground hover:bg-secondary',
    outline: 'border border-border bg-card text-foreground hover:border-primary/50 hover:bg-secondary/60',
    danger: 'bg-[hsl(var(--destructive))] text-white hover:opacity-90',
  };
  return <button {...props} type={type} onClick={onClick} disabled={disabled} className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}>{children}</button>;
}

function Field({ label, value, onChange, placeholder, required, type = 'text', name, hint }: {
  label: string; value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean; type?: string; name: string; hint?: string;
}) {
  return <label className="block space-y-2">
    <span className="text-sm font-semibold text-foreground">{label}{required && <span className="ml-1 text-[hsl(var(--destructive))]">*</span>}</span>
    <input data-testid={`input-${name}`} type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder}
      className="w-full rounded-2xl border border-border bg-card/80 px-4 py-3.5 text-[15px] transition placeholder:text-muted-foreground/70 hover:border-primary/40 focus:border-primary focus:outline-none" />
    {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
  </label>;
}

function Alert({ children, kind = 'error' }: { children: ReactNode; kind?: 'error' | 'success' | 'info' }) {
  const style = kind === 'error' ? 'border-red-200 bg-red-50 text-red-800' : kind === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-border bg-secondary/60 text-foreground';
  return <div role={kind === 'error' ? 'alert' : 'status'} className={`rounded-2xl border px-4 py-3 text-sm ${style}`}>{children}</div>;
}

function LoadingBlock({ label = 'Getting things ready' }: { label?: string }) {
  return <div className="space-y-4" aria-label={label}>
    <div className="h-3 w-24 animate-pulse rounded-full bg-secondary" />
    <div className="h-10 w-3/4 animate-pulse rounded-xl bg-secondary" />
    <div className="h-24 animate-pulse rounded-3xl bg-secondary/70" />
  </div>;
}

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-3" data-testid="text-brand">
    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground"><Compass size={20} strokeWidth={1.8} /></div>
    {!compact && <div><div className="serif text-[22px] leading-none">Morrow</div><div className="mono mt-1 text-[9px] uppercase tracking-[.18em] text-muted-foreground">career, considered</div></div>}
  </div>;
}

function Frame({ children, active = '' }: { children: ReactNode; active?: string }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const links = [
    { href: '/', label: 'My space' },
    { href: '/recommendations', label: 'Role ideas' },
    { href: '/settings', label: 'Settings' },
  ];
  return <div className="paper-grain min-h-[100dvh]">
    <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
      <Link href="/" className="no-underline"><Brand /></Link>
      <button className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card md:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(!mobileOpen)} data-testid="button-menu">{mobileOpen ? <X size={19} /> : <Menu size={19} />}</button>
      <nav className={`${mobileOpen ? 'absolute left-4 right-4 top-[76px] flex flex-col rounded-3xl border border-border bg-card p-3 shadow-xl' : 'hidden'} md:static md:flex md:flex-row md:items-center md:gap-2 md:border-0 md:bg-transparent md:p-0 md:shadow-none`} aria-label="Main navigation">
        {links.map((link) => <Link key={link.href} href={link.href} data-testid={`link-nav-${link.label.toLowerCase().replaceAll(' ', '-')}`}
          onClick={() => setMobileOpen(false)} className={`rounded-full px-4 py-2.5 text-sm no-underline transition ${active === link.href ? 'bg-secondary font-semibold text-primary' : 'text-muted-foreground hover:bg-secondary/70 hover:text-foreground'}`}>{link.label}</Link>)}
        <div className="mx-3 hidden h-8 border-l border-border md:block" />
        <button onClick={logout} className="rounded-full px-4 py-2.5 text-left text-sm text-muted-foreground hover:bg-secondary md:text-center" data-testid="button-sign-out-nav"><LogOut className="mr-2 inline" size={15} />Sign out</button>
      </nav>
      <span className="hidden max-w-40 truncate text-sm text-muted-foreground lg:block" data-testid="text-account">{user?.firstName || user?.email || 'Your private space'}</span>
    </header>
    <main className="mx-auto max-w-7xl px-5 pb-20 pt-5 sm:px-8">{children}</main>
    <footer className="mx-auto flex max-w-7xl items-center gap-2 px-5 pb-8 text-xs text-muted-foreground sm:px-8"><LockKeyhole size={13} /> Your answers stay private to your account and aren’t used to train this app.</footer>
  </div>;
}

function SignIn() {
  const { login, isLoading } = useAuth();
  return <div className="paper-grain min-h-[100dvh] overflow-hidden">
    <div className="mx-auto grid min-h-[100dvh] max-w-7xl items-center gap-12 px-5 py-8 md:grid-cols-[1fr_.9fr] md:px-10">
      <section className="fade-up relative z-10 mx-auto w-full max-w-lg">
        <Brand />
        <p className="mono mt-16 text-[10px] uppercase tracking-[.2em] text-primary">A quieter kind of career guidance</p>
        <h1 className="serif mt-5 text-[clamp(3.4rem,8vw,6.8rem)] leading-[.91] tracking-[-.035em] text-foreground">Try on a<br /><em className="text-primary">future.</em></h1>
        <p className="mt-7 max-w-md text-lg leading-8 text-muted-foreground">A private space to explore work that might fit you — before you have to choose.</p>
        <Button onClick={login} disabled={isLoading} className="mt-9 min-w-48" data-testid="button-sign-in">{isLoading ? <LoaderCircle className="animate-spin" size={17} /> : <>Continue to your space <ArrowRight size={17} /></>}</Button>
        <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground"><LockKeyhole size={14} /> Sign in securely. No hiring portal, no public profile.</div>
      </section>
      <aside className="relative hidden min-h-[620px] items-center justify-center md:flex">
        <div className="absolute inset-8 rotate-[-4deg] rounded-[42%_58%_56%_44%/52%_39%_61%_48%] bg-[#e8d9b7]" />
        <div className="absolute inset-16 rotate-[7deg] rounded-[51%_49%_42%_58%/40%_52%_48%_60%] border border-[#c6b98f]" />
        <div className="relative flex h-[440px] w-[400px] flex-col justify-between rounded-[2.5rem] border border-white/70 bg-[#f7f0df]/90 p-8 shadow-[0_30px_90px_-45px_rgba(57,67,48,.36)] backdrop-blur-sm">
          <div className="flex items-start justify-between"><span className="mono text-[10px] uppercase tracking-[.18em] text-primary">field notes / 01</span><Sparkles className="text-[hsl(var(--accent))]" size={19} /></div>
          <div className="relative mx-auto grid h-48 w-48 place-items-center rounded-full border border-primary/30">
            <div className="absolute h-36 w-36 rounded-full bg-[#d9a56f]/55" />
            <div className="absolute h-24 w-24 translate-x-8 translate-y-6 rounded-full bg-[#547c6e]/80" />
            <div className="absolute h-16 w-16 -translate-x-9 -translate-y-8 rounded-full bg-[#f0d982]" />
            <span className="serif relative mt-32 text-2xl italic text-primary">possibility</span>
          </div>
          <div><p className="serif text-3xl leading-tight">There is more than<br />one good way forward.</p><div className="mt-5 flex items-center justify-between text-xs text-muted-foreground"><span>Made for your becoming</span><span className="mono">IN · 2025</span></div></div>
        </div>
        <div className="absolute right-0 top-20 rounded-full border border-border bg-card/90 px-4 py-2 text-xs text-primary shadow-sm">Curiosity before commitment</div>
        <div className="absolute bottom-14 left-0 rounded-full bg-primary px-4 py-2 text-xs text-primary-foreground shadow-sm">Your pace. Your path.</div>
      </aside>
    </div>
  </div>;
}

function Welcome({ profile, loading, error, onRetry }: { profile: CareerProfileInput | null; loading: boolean; error?: boolean; onRetry: () => void }) {
  if (loading) return <Frame><div className="mx-auto max-w-2xl pt-16"><LoadingBlock /></div></Frame>;
  if (error) return <Frame><div className="mx-auto max-w-xl pt-16"><Alert>We couldn’t load your space just now. Your saved information hasn’t changed.</Alert><Button className="mt-4" onClick={onRetry}>Try again</Button></div></Frame>;
  return <Frame active="/">
    <section className="mx-auto max-w-5xl pt-8 md:pt-16">
      <p className="mono text-[10px] uppercase tracking-[.2em] text-primary">A little room to think</p>
      <h1 className="serif mt-4 text-5xl leading-tight sm:text-7xl">Welcome{profile?.name ? `, ${profile.name.split(' ')[0]}` : ' to your space'}.</h1>
      <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">You don’t need a five-year plan. Just a few honest answers about what feels like you.</p>
      <div className="mt-12 grid gap-5 md:grid-cols-[1.2fr_.8fr]">
        <div className="relative overflow-hidden rounded-[2rem] bg-primary p-7 text-primary-foreground sm:p-10">
          <div className="absolute -right-12 -top-16 h-56 w-56 rounded-full border border-white/20" /><div className="absolute -right-4 -top-8 h-40 w-40 rounded-full border border-white/20" />
          <div className="relative"><span className="mono text-[10px] uppercase tracking-[.18em] text-white/65">{profile ? 'Your exploration' : 'Start wherever you are'}</span>
            <h2 className="serif mt-6 max-w-md text-4xl leading-tight sm:text-5xl">{profile ? 'There’s always another direction to explore.' : 'Let’s find a few directions worth exploring.'}</h2>
            <p className="mt-5 max-w-md leading-7 text-white/75">{profile ? 'Your profile is saved. Revisit your answers or see what roles could fit.' : 'A short guided reflection will help us understand what energises you.'}</p>
            <Link href={profile ? '/recommendations' : '/onboarding'} data-testid="link-start-exploring" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#f5e8c9] px-5 py-3 text-sm font-semibold text-primary no-underline transition hover:-translate-y-0.5">{profile ? 'See your role ideas' : 'Begin your reflection'} <ArrowRight size={16} /></Link>
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-[2rem] border border-border bg-card/70 p-7 sm:p-8">
          <div><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f0e0c3] text-primary"><Heart size={19} /></div><p className="mono mt-7 text-[10px] uppercase tracking-[.16em] text-muted-foreground">A note to keep</p><p className="serif mt-3 text-3xl leading-snug">You can be curious without having it all figured out.</p></div>
          <div className="mt-10 flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck size={15} /> Only your confirmed profile is saved.</div>
        </div>
      </div>
      {profile && <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card/50 px-5 py-4">
        <div><p className="font-semibold">Your profile is ready to revisit</p><p className="mt-1 text-sm text-muted-foreground">{profile.city || 'Your city'} · {profile.persona === 'student' ? 'Student' : 'Professional'}</p></div>
        <Link href="/profile-review" className="inline-flex items-center gap-2 text-sm font-semibold text-primary no-underline" data-testid="link-edit-profile">Edit profile <ChevronRight size={16} /></Link>
      </div>}
    </section>
  </Frame>;
}

function Onboarding({ draft, setDraft, setPersonaGuess }: { draft: CareerProfileInput; setDraft: (d: CareerProfileInput) => void; setPersonaGuess: (p: Persona | null) => void }) {
  const [path, setPath] = useState<'resume' | 'basic' | null>(null);
  const [fileName, setFileName] = useState('');
  const [parseError, setParseError] = useState('');
  const [resumeText, setResumeText] = useState('');
  const parseResume = useParseCareerResume();
  const [, setLocation] = useLocation();
  const update = (key: keyof CareerProfileInput, value: string) => {
    const nullable = ['ageBand', 'currentStage', 'company', 'yearsExperience', 'familyExpectations', 'moneyNeeds', 'relocation'].includes(key);
    setDraft({ ...draft, [key]: nullable ? value || null : value });
  };
  const onFile = async (event: FormEvent<HTMLInputElement>) => {
    const file = (event.currentTarget as HTMLInputElement).files?.[0];
    if (!file) return;
    setParseError('');
    if (file.type !== 'application/pdf') { setParseError('Please choose a PDF file.'); return; }
    if (file.size > 4 * 1024 * 1024) { setParseError('This PDF is over 4 MB. Choose a smaller file.'); return; }
    setFileName(file.name);
    try {
      const bytes = await file.arrayBuffer();
      let binary = '';
      new Uint8Array(bytes).forEach((byte) => { binary += String.fromCharCode(byte); });
      const encoded = btoa(binary);
      parseResume.mutate({ data: { file: encoded, name: draft.name.trim(), city: draft.city.trim(), ageBand: draft.ageBand } }, {
        onSuccess: (result) => {
          setDraft(result.draft);
          setPersonaGuess(result.personaGuess);
        },
        onError: () => setParseError('We couldn’t read that PDF. You can try again or enter a few details instead.'),
      });
      // The encoded file exists only for the request and is never put in React state or persisted.
    } catch {
      setParseError('We couldn’t open that PDF. Try entering a few details instead.');
    }
  };
  const parsePastedText = () => {
    setParseError('');
    parseResume.mutate({ data: { resumeText: resumeText.trim(), name: draft.name.trim(), city: draft.city.trim(), ageBand: draft.ageBand } }, {
      onSuccess: (result) => {
        setDraft(result.draft);
        setPersonaGuess(result.personaGuess);
      },
      onError: () => setParseError('We couldn’t use that text. Please check it and try again.'),
    });
  };
  const submitBasic = (event: FormEvent) => {
    event.preventDefault();
    const guess: Persona = /work|job|company|office/i.test(draft.currentStage || '') ? 'professional' : 'student';
    setDraft({ ...draft, persona: guess });
    setPersonaGuess(guess);
    setLocation('/persona');
  };
  const continueAfterResume = () => setLocation('/persona');
  return <Frame>
    <div className="mx-auto max-w-3xl pt-4">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground no-underline hover:text-primary"><ArrowLeft size={15} /> Back to your space</Link>
      <p className="mono mt-10 text-[10px] uppercase tracking-[.2em] text-primary">First, the basics</p>
      <h1 className="serif mt-3 text-5xl leading-tight sm:text-6xl">Where are you<br className="hidden sm:block" /> starting from?</h1>
      <p className="mt-4 max-w-xl leading-7 text-muted-foreground">Choose the path that feels easiest. Nothing is saved until you review and confirm your profile.</p>
      {!path && <div className="mt-9 grid gap-4 sm:grid-cols-2">
        <button onClick={() => setPath('resume')} className="group rounded-[1.7rem] border border-border bg-card p-6 text-left transition hover:-translate-y-1 hover:border-primary/50" data-testid="button-path-resume"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0e0c3] text-primary"><FileText size={21} /></div><h2 className="serif mt-5 text-3xl">Use a resume</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">We’ll suggest editable facts from a PDF. The file is discarded after reading.</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">Choose PDF <ArrowRight size={15} /></span></button>
        <button onClick={() => setPath('basic')} className="group rounded-[1.7rem] border border-border bg-card p-6 text-left transition hover:-translate-y-1 hover:border-primary/50" data-testid="button-path-basic"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dfe9df] text-primary"><Compass size={21} /></div><h2 className="serif mt-5 text-3xl">Start with basics</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">A few simple details are plenty. We can fill in the rest together.</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary">Enter details <ArrowRight size={15} /></span></button>
      </div>}
      {path === 'resume' && <section className="mt-8 rounded-[1.7rem] border border-border bg-card p-6 sm:p-8">
        <button onClick={() => setPath(null)} className="text-sm text-muted-foreground hover:text-primary" data-testid="button-change-path"><ArrowLeft className="mr-1 inline" size={14} /> Choose another path</button>
        <h2 className="serif mt-5 text-3xl">Add a PDF resume</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">We only use it to suggest draft facts. Check and edit every detail before continuing.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="What should we call you?" name="resume-name" value={draft.name} onChange={(v) => update('name', v)} placeholder="Your name" required />
          <Field label="Which city are you in?" name="resume-city" value={draft.city} onChange={(v) => update('city', v)} placeholder="e.g. Pune" required />
          <label className="block space-y-2"><span className="text-sm font-semibold">Age band <span className="font-normal text-muted-foreground">· optional</span></span><select data-testid="input-resume-age-band" value={draft.ageBand || ''} onChange={(e) => update('ageBand', e.target.value)} className="w-full rounded-2xl border border-border bg-card px-4 py-3.5"><option value="">Prefer not to say</option><option value="under-18">Under 18</option><option value="18-21">18–21</option><option value="22-25">22–25</option><option value="26-30">26–30</option><option value="31+">31+</option></select></label>
        </div>
        <label className="mt-6 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-primary/40 bg-secondary/30 p-6 text-center hover:bg-secondary/60">
          {parseResume.isPending ? <><LoaderCircle className="animate-spin text-primary" size={24} /><span className="mt-3 text-sm font-semibold">Reading your PDF…</span></> : <><FileText className="text-primary" size={25} /><span className="mt-3 text-sm font-semibold">{fileName || 'Choose a PDF from this device'}</span><span className="mt-1 text-xs text-muted-foreground">PDF only · up to 4 MB · file not retained</span></>}
          <input data-testid="input-resume-pdf" className="sr-only" type="file" accept="application/pdf,.pdf" onChange={onFile} disabled={parseResume.isPending} />
        </label>
        <div className="mt-6">
          <label className="block space-y-2"><span className="text-sm font-semibold">Or paste your resume text</span><textarea data-testid="input-resume-text" rows={5} value={resumeText} onChange={(event) => setResumeText(event.target.value)} placeholder="Paste the text here if your PDF is scanned or hard to read." className="w-full resize-y rounded-2xl border border-border bg-background/60 px-4 py-3 text-sm leading-6 placeholder:text-muted-foreground/70" /></label>
          <Button variant="outline" className="mt-3" onClick={parsePastedText} disabled={parseResume.isPending || !resumeText.trim() || !draft.name.trim() || !draft.city.trim()}>{parseResume.isPending ? <LoaderCircle className="animate-spin" size={16} /> : null} Use pasted text</Button>
        </div>
        {parseError && <div className="mt-4"><Alert>{parseError}</Alert></div>}
        {parseResume.isSuccess && <div className="mt-5 space-y-4"><Alert kind="success">{parseResume.data.note || 'Draft facts are ready to review. Nothing has been saved.'}</Alert>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Current stage" name="resume-stage" value={draft.currentStage || ''} onChange={(v) => update('currentStage', v)} />
            <Field label="Company" name="resume-company" value={draft.company || ''} onChange={(v) => update('company', v)} />
            <Field label="Years of experience" name="resume-experience" value={draft.yearsExperience || ''} onChange={(v) => update('yearsExperience', v)} />
            <Field label="Internships" name="resume-internships" value={draft.internships.join(', ')} onChange={(v) => setDraft({ ...draft, internships: v.split(',').map((item) => item.trim()).filter(Boolean) })} hint="Separate multiple entries with commas." />
            <Field label="Interests" name="resume-interests" value={draft.interests.join(', ')} onChange={(v) => setDraft({ ...draft, interests: v.split(',').map((item) => item.trim()).filter(Boolean) })} />
            <Field label="Strengths" name="resume-strengths" value={draft.strengths.join(', ')} onChange={(v) => setDraft({ ...draft, strengths: v.split(',').map((item) => item.trim()).filter(Boolean) })} />
            <Field label="Work style" name="resume-work-style" value={draft.workStyle} onChange={(v) => setDraft({ ...draft, workStyle: v })} />
            <Field label="Things you like to make" name="resume-preferred-make" value={draft.preferredMake} onChange={(v) => setDraft({ ...draft, preferredMake: v })} />
          </div>
          <Button onClick={continueAfterResume} disabled={!draft.name || !draft.city}>Review what we inferred <ArrowRight size={16} /></Button>
        </div>}
      </section>}
      {path === 'basic' && <form onSubmit={submitBasic} className="mt-8 rounded-[1.7rem] border border-border bg-card p-6 sm:p-8">
        <button type="button" onClick={() => setPath(null)} className="text-sm text-muted-foreground hover:text-primary" data-testid="button-change-path"><ArrowLeft className="mr-1 inline" size={14} /> Choose another path</button>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="What should we call you?" name="name" value={draft.name} onChange={(v) => update('name', v)} placeholder="Your name" required />
          <Field label="Which city are you in?" name="city" value={draft.city} onChange={(v) => update('city', v)} placeholder="e.g. Pune" required />
          <label className="block space-y-2"><span className="text-sm font-semibold">Age band <span className="font-normal text-muted-foreground">· optional</span></span><select data-testid="input-age-band" value={draft.ageBand || ''} onChange={(e) => update('ageBand', e.target.value)} className="w-full rounded-2xl border border-border bg-card px-4 py-3.5"><option value="">Prefer not to say</option><option value="under-18">Under 18</option><option value="18-21">18–21</option><option value="22-25">22–25</option><option value="26-30">26–30</option><option value="31+">31+</option></select></label>
          <label className="block space-y-2 sm:col-span-2"><span className="text-sm font-semibold">What takes up most of your weekdays?</span><select data-testid="input-current-stage" value={draft.currentStage || ''} onChange={(event) => setDraft({ ...draft, currentStage: event.target.value || null })} className="w-full rounded-2xl border border-border bg-card px-4 py-3.5"><option value="">Choose what feels closest</option><option value="School or college study">School or college</option><option value="Current job or company work">A job or company work</option><option value="A mix of study and work">A mix of study and work</option><option value="Between things and exploring">Between things / exploring</option></select></label>
          <Field label="Internships or practical experience" name="internships" value={draft.internships.join(', ')} onChange={(v) => setDraft({ ...draft, internships: v.split(',').map((item) => item.trim()).filter(Boolean) })} hint="Optional. Separate entries with commas." />
        </div>
        <div className="mt-7 flex flex-col-reverse justify-between gap-3 sm:flex-row sm:items-center"><span className="text-xs text-muted-foreground">You can change these details later.</span><Button type="submit" disabled={!draft.name.trim() || !draft.city.trim()}>Continue <ArrowRight size={16} /></Button></div>
      </form>}
    </div>
  </Frame>;
}

function PersonaPage({ draft, setDraft, personaGuess }: { draft: CareerProfileInput; setDraft: (d: CareerProfileInput) => void; personaGuess: Persona | null }) {
  const [, setLocation] = useLocation();
  const persona = draft.persona;
  const choose = (value: Persona) => setDraft({ ...draft, persona: value });
  return <Frame>
    <div className="mx-auto max-w-3xl pt-4">
      <button onClick={() => setLocation('/onboarding')} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary" data-testid="button-back-onboarding"><ArrowLeft size={15} /> Back</button>
      <p className="mono mt-10 text-[10px] uppercase tracking-[.2em] text-primary">A first impression, not a label</p>
      <h1 className="serif mt-3 text-5xl leading-tight sm:text-6xl">What season are<br />you in right now?</h1>
      <p className="mt-4 max-w-xl leading-7 text-muted-foreground">We may have a guess from what you shared. You know yourself best — change this whenever you like.</p>
      {personaGuess && <div className="mt-5"><Alert kind="info">Based on what you shared, we’re leaning toward <strong>{personaGuess === 'student' ? 'student / early exploration' : 'working professional'}.</strong> Does that feel close? You can change it here.</Alert></div>}
      {!personaGuess && <div className="mt-5"><Alert kind="info">Here’s a first guess to help us begin. Choose whichever description feels closest, and you can change it later.</Alert></div>}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {([
          ['student', 'I’m studying or figuring out my first steps', 'Exploring what could come after my studies, or alongside them.'],
          ['professional', 'I’m working and considering what’s next', 'Building experience, making a change, or finding a better fit.'],
        ] as [Persona, string, string][]).map(([value, title, detail]) => <button key={value} onClick={() => choose(value)} aria-pressed={persona === value} className={`rounded-[1.7rem] border p-6 text-left transition ${persona === value ? 'border-primary bg-[#e7eee7] shadow-[0_12px_30px_-22px_hsl(var(--primary))]' : 'border-border bg-card hover:border-primary/50'}`} data-testid={`button-persona-${value}`}><div className={`grid h-8 w-8 place-items-center rounded-full border ${persona === value ? 'border-primary bg-primary text-white' : 'border-border'}`}>{persona === value && <Check size={15} />}</div><h2 className="serif mt-5 text-3xl">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p></button>)}
      </div>
      {persona === 'professional' && <div className="mt-5 grid gap-4 rounded-[1.5rem] border border-border bg-card/70 p-5 sm:grid-cols-2">
        <Field label="Current company" name="persona-company" value={draft.company || ''} onChange={(v) => setDraft({ ...draft, company: v || null })} placeholder="Optional" />
        <Field label="Years of experience" name="persona-years" value={draft.yearsExperience || ''} onChange={(v) => setDraft({ ...draft, yearsExperience: v || null })} placeholder="e.g. 2 years" />
      </div>}
      {persona === 'student' && <div className="mt-5 rounded-[1.5rem] border border-border bg-card/70 p-5"><Field label="What are you studying or doing now?" name="persona-stage" value={draft.currentStage || ''} onChange={(v) => setDraft({ ...draft, currentStage: v || null })} placeholder="e.g. second year of economics" /></div>}
      <div className="mt-8 flex justify-end"><Button onClick={() => setLocation('/questions')}>Continue <ArrowRight size={16} /></Button></div>
    </div>
  </Frame>;
}

function Questions({ draft, setDraft, answers, setAnswers }: { draft: CareerProfileInput; setDraft: (d: CareerProfileInput) => void; answers: AnswerEntry[]; setAnswers: (a: AnswerEntry[]) => void }) {
  const nextQuestion = useGetNextCareerQuestion();
  const [, setLocation] = useLocation();
  const [question, setQuestion] = useState<NextQuestionResult | null>(null);
  const [freeText, setFreeText] = useState('');
  const [selected, setSelected] = useState('');
  const didStart = useRef(false);
  const [actionError, setActionError] = useState('');
  const requestQuestion = useCallback((currentAnswers: AnswerEntry[], currentDraft = draft) => {
    setActionError('');
    nextQuestion.mutate({ data: { draft: currentDraft, persona: currentDraft.persona, answers: currentAnswers.slice(-7) } }, {
      onSuccess: (result) => {
        setQuestion(result);
        setFreeText('');
        setSelected('');
        if (result.complete) {
          if (result.draft) setDraft(result.draft);
          setLocation('/profile-review');
        }
      },
      onError: () => setActionError('We hit a pause choosing your next question. Your answers are still here — try again.'),
    });
  }, [draft, nextQuestion.mutate, setDraft, setLocation]);
  useEffect(() => {
    if (!didStart.current) {
      didStart.current = true;
      requestQuestion(answers);
    }
  }, [requestQuestion, answers]);
  const submitAnswer = (answer = selected || freeText.trim()) => {
    if (!question || !answer.trim()) return;
    const updatedAnswers = [...answers, { topic: question.topic || `reflection-${answers.length + 1}`, answer: answer.trim() }].slice(-7);
    setAnswers(updatedAnswers);
    // Keep structured draft fields in memory only; answers are intentionally not persisted until profile confirmation.
    const topic = (question.topic || '').toLowerCase();
    const nextDraft = { ...draft };
    if (topic.includes('interest')) nextDraft.interests = [answer.trim()];
    else if (topic.includes('energ')) nextDraft.energizers = [answer.trim()];
    else if (topic.includes('strength')) nextDraft.strengths = [answer.trim()];
    else if (topic.includes('style')) nextDraft.workStyle = answer.trim();
    else if (topic.includes('money')) nextDraft.moneyNeeds = answer.trim();
    else if (topic.includes('family')) nextDraft.familyExpectations = answer.trim();
    setDraft(nextDraft);
    requestQuestion(updatedAnswers, nextDraft);
  };
  return <Frame>
    <div className="mx-auto max-w-3xl pt-4">
      <button onClick={() => setLocation('/persona')} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary" data-testid="button-back-persona"><ArrowLeft size={15} /> Back</button>
      <div className="mt-9 flex items-center justify-between"><p className="mono text-[10px] uppercase tracking-[.2em] text-primary">A conversation with yourself</p><span className="mono text-xs text-muted-foreground">{Math.min(answers.length + 1, 7)} / 7</span></div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min((answers.length / 7) * 100, 92)}%` }} /></div>
      {nextQuestion.isPending && !question ? <div className="mt-12 rounded-[2rem] border border-border bg-card p-7 sm:p-10"><LoadingBlock label="Finding a thoughtful question" /></div> :
        question?.complete ? <div className="mt-12 rounded-[2rem] border border-border bg-card p-8"><h1 className="serif text-4xl">That’s a good start.</h1><p className="mt-3 text-muted-foreground">Let’s take a look at what we’ve gathered.</p><Button className="mt-6" onClick={() => setLocation('/profile-review')}>Review your profile <ArrowRight size={16} /></Button></div> :
          <section className="mt-7 rounded-[2rem] border border-border bg-card p-6 sm:p-10">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f0e0c3] text-primary"><Sparkles size={19} /></div>
            <h1 className="serif mt-7 max-w-2xl text-4xl leading-tight sm:text-5xl" data-testid="text-career-question">{question?.question || 'What kind of work feels worth your energy?'}</h1>
            <p className="mt-3 text-sm text-muted-foreground">There isn’t a right answer. Choose one, or put it in your own words.</p>
            {question?.options?.length ? <div className="mt-7 grid gap-3 sm:grid-cols-2">{question.options.map((option, index) => <button key={`${option}-${index}`} onClick={() => { setSelected(option); setFreeText(''); }} aria-pressed={selected === option} className={`rounded-2xl border px-4 py-4 text-left text-sm leading-6 transition ${selected === option ? 'border-primary bg-[#e7eee7] text-primary' : 'border-border bg-background/60 hover:border-primary/50'}`} data-testid={`button-answer-option-${index}`}>{option}</button>)}</div> : null}
            {(!question || question.allowFreeText || !question.options?.length) && <label className="mt-6 block"><span className="sr-only">Your answer</span><textarea data-testid="input-answer-free-text" rows={3} value={freeText} onChange={(e) => { setFreeText(e.target.value); setSelected(''); }} placeholder="A few words is enough…" className="w-full resize-y rounded-2xl border border-border bg-background/60 px-4 py-4 text-sm leading-6 placeholder:text-muted-foreground/70" /></label>}
            {actionError && <div className="mt-5"><Alert>{actionError}</Alert><Button variant="outline" className="mt-3" onClick={() => requestQuestion(answers)}>Retry</Button></div>}
            <div className="mt-8 flex items-center justify-between gap-3"><button onClick={() => setLocation('/profile-review')} className="text-sm text-muted-foreground hover:text-primary" data-testid="button-skip-reflection">Skip for now</button><Button onClick={() => submitAnswer()} disabled={nextQuestion.isPending || (!selected && !freeText.trim())}>{nextQuestion.isPending ? <LoaderCircle className="animate-spin" size={16} /> : <>Continue <ArrowRight size={16} /></>}</Button></div>
          </section>}
    </div>
  </Frame>;
}

function ProfileReview({ draft, setDraft, onSaved }: { draft: CareerProfileInput; setDraft: (d: CareerProfileInput) => void; onSaved: () => void }) {
  const saveProfile = useSaveCareerProfile();
  const [error, setError] = useState('');
  const update = (key: keyof CareerProfileInput, value: string) => {
    const nullable = ['ageBand', 'currentStage', 'company', 'yearsExperience', 'familyExpectations', 'moneyNeeds', 'relocation'].includes(key);
    setDraft({ ...draft, [key]: nullable ? value || null : value });
  };
  const listField = (label: string, key: 'interests' | 'energizers' | 'chores' | 'strengths' | 'constraints') => <Field label={label} name={`review-${key}`} value={draft[key].join(', ')} onChange={(value) => setDraft({ ...draft, [key]: value.split(',').map((item) => item.trim()).filter(Boolean) })} placeholder="Separate a few with commas" />;
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    saveProfile.mutate({ data: draft }, { onSuccess: onSaved, onError: () => setError('We couldn’t save your profile. Your draft is still here — please try again.') });
  };
  return <Frame>
    <div className="mx-auto max-w-4xl pt-4">
      <Link href="/questions" className="inline-flex items-center gap-2 text-sm text-muted-foreground no-underline hover:text-primary" data-testid="link-back-questions"><ArrowLeft size={15} /> Back to reflections</Link>
      <p className="mono mt-10 text-[10px] uppercase tracking-[.2em] text-primary">Your words, your call</p>
      <h1 className="serif mt-3 text-5xl leading-tight sm:text-6xl">Does this sound<br className="hidden sm:block" /> like you?</h1>
      <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Everything below is an editable draft. Only selecting “Save my profile” stores it to your account.</p>
      <form onSubmit={submit} className="mt-8 space-y-5">
        <section className="rounded-[1.7rem] border border-border bg-card p-6 sm:p-8">
          <div className="mb-5 flex items-center justify-between"><h2 className="serif text-3xl">Your starting point</h2><span className="mono text-[9px] uppercase tracking-wider text-muted-foreground">01 / basics</span></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" name="review-name" value={draft.name} onChange={(v) => update('name', v)} required />
            <Field label="City" name="review-city" value={draft.city} onChange={(v) => update('city', v)} required />
            <label className="block space-y-2"><span className="text-sm font-semibold">Age band · optional</span><select data-testid="input-review-age-band" value={draft.ageBand || ''} onChange={(e) => update('ageBand', e.target.value)} className="w-full rounded-2xl border border-border bg-card px-4 py-3.5"><option value="">Prefer not to say</option><option value="under-18">Under 18</option><option value="18-21">18–21</option><option value="22-25">22–25</option><option value="26-30">26–30</option><option value="31+">31+</option></select></label>
            <label className="block space-y-2"><span className="text-sm font-semibold">Your current season</span><select data-testid="input-review-persona" value={draft.persona} onChange={(e) => setDraft({ ...draft, persona: e.target.value as Persona })} className="w-full rounded-2xl border border-border bg-card px-4 py-3.5"><option value="student">Student / exploring early steps</option><option value="professional">Working / exploring what’s next</option></select></label>
            <Field label={draft.persona === 'student' ? 'What are you studying?' : 'Current stage'} name="review-stage" value={draft.currentStage || ''} onChange={(v) => update('currentStage', v)} />
            {draft.persona === 'professional' && <><Field label="Company" name="review-company" value={draft.company || ''} onChange={(v) => update('company', v)} /><Field label="Years of experience" name="review-experience" value={draft.yearsExperience || ''} onChange={(v) => update('yearsExperience', v)} /></>}
          </div>
        </section>
        <section className="rounded-[1.7rem] border border-border bg-card p-6 sm:p-8">
          <div className="mb-5 flex items-center justify-between"><h2 className="serif text-3xl">What feels like you</h2><span className="mono text-[9px] uppercase tracking-wider text-muted-foreground">02 / your patterns</span></div>
          <div className="grid gap-4 sm:grid-cols-2">{listField('Interests', 'interests')}{listField('Things that energise you', 'energizers')}{listField('Strengths you recognise', 'strengths')}{listField('Tasks you would rather avoid', 'chores')}{listField('Constraints to keep in mind', 'constraints')}<Field label="Work style" name="review-work-style" value={draft.workStyle} onChange={(v) => update('workStyle', v)} placeholder="e.g. independent, collaborative…" /><Field label="What do you like to make?" name="review-preferred-make" value={draft.preferredMake} onChange={(v) => update('preferredMake', v)} /></div>
        </section>
        <section className="rounded-[1.7rem] border border-border bg-card p-6 sm:p-8">
          <div className="mb-5 flex items-center justify-between"><h2 className="serif text-3xl">Real-life considerations</h2><span className="mono text-[9px] uppercase tracking-wider text-muted-foreground">03 / context</span></div>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Family expectations" name="review-family" value={draft.familyExpectations || ''} onChange={(v) => update('familyExpectations', v)} /><Field label="Money needs" name="review-money" value={draft.moneyNeeds || ''} onChange={(v) => update('moneyNeeds', v)} /><Field label="Relocation" name="review-relocation" value={draft.relocation || ''} onChange={(v) => update('relocation', v)} /></div>
        </section>
        {error && <Alert>{error}</Alert>}
        {saveProfile.isSuccess && <Alert kind="success">Your confirmed profile is saved.</Alert>}
        <div className="sticky bottom-3 z-20 flex flex-col-reverse items-stretch justify-between gap-3 rounded-2xl border border-border bg-background/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center"><span className="px-2 text-xs text-muted-foreground"><LockKeyhole className="mr-1 inline" size={13} /> Only confirmed details are saved.</span><Button type="submit" disabled={saveProfile.isPending || !draft.name.trim() || !draft.city.trim()}>{saveProfile.isPending ? <><LoaderCircle className="animate-spin" size={16} /> Saving…</> : <>Save my profile <Check size={16} /></>}</Button></div>
      </form>
    </div>
  </Frame>;
}

const roleNotes: Record<string, string> = {
  'Software Engineer': 'Build useful things with code, from small product details to the systems behind them.',
  Marketing: 'Understand people and help the right ideas find the people who need them.',
  'Content Creation / Design': 'Turn observations into clear stories, experiences, and visual worlds.',
  'Product Manager': 'Bring people, problems, and possibilities together to shape what gets built.',
};
function Recommendations({ profile, answers }: { profile: CareerProfileInput | null; answers: AnswerEntry[] }) {
  const generate = useGenerateCareerRecommendations();
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [error, setError] = useState('');
  const request = useCallback(() => {
    if (!profile) return;
    setError('');
    generate.mutate({ data: { profile, answers: answers.slice(-7) } }, { onSuccess: setResult, onError: () => setError('We couldn’t shape your role ideas just now. Your profile is safe — try again.') });
  }, [profile, answers, generate.mutate]);
  useEffect(() => { if (profile && !result && !generate.isPending && !error) request(); }, [profile, result, generate.isPending, error, request]);
  const allRoles = ['Software Engineer', 'Marketing', 'Content Creation / Design', 'Product Manager'];
  const remaining = allRoles.filter((role) => !result?.recommendations.some((rec) => rec.role === role));
  return <Frame active="/recommendations">
    <div className="mx-auto max-w-5xl pt-4">
      <p className="mono text-[10px] uppercase tracking-[.2em] text-primary">Ideas to try on · not a verdict</p>
      <h1 className="serif mt-3 text-5xl leading-tight sm:text-6xl">A few paths<br className="sm:hidden" /> worth a look.</h1>
      <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">These are starting points based on what you shared — not a score of your potential. Follow the thread that feels interesting.</p>
      {generate.isPending && <div className="mt-9 grid gap-4 md:grid-cols-3">{[1, 2, 3].map((n) => <div key={n} className="h-64 animate-pulse rounded-[1.7rem] bg-secondary/70" />)}</div>}
      {error && <div className="mt-8"><Alert>{error}</Alert><Button onClick={request} className="mt-4">Try again</Button></div>}
      {result && <div className="mt-9 grid gap-4 md:grid-cols-3">{result.recommendations.map((rec, index) => <article key={rec.role} className={`relative flex min-h-72 flex-col rounded-[1.7rem] border p-6 ${index === 0 ? 'border-primary/40 bg-[#e7eee7]' : 'border-border bg-card'}`} data-testid={`card-role-${index}`}>
        <div className="flex items-center justify-between"><span className="mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">Possibility 0{index + 1}</span><span className="mono text-xs text-primary">{rec.fit}% fit</span></div>
        <h2 className="serif mt-7 text-3xl leading-tight">{rec.role}</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{rec.why || roleNotes[rec.role]}</p>
        {rec.quote && <blockquote className="serif mt-auto border-l-2 border-[hsl(var(--accent))] pl-3 pt-6 text-lg italic leading-6">“{rec.quote}”</blockquote>}
        <div className="mt-5 h-1.5 rounded-full bg-secondary"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(Math.max(rec.fit, 1), 100)}%` }} /></div>
      </article>)}</div>}
      <section className="mt-8 rounded-[1.7rem] border border-border bg-card/70 p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mono text-[9px] uppercase tracking-[.18em] text-primary">The wider field</p><h2 className="serif mt-2 text-3xl">Explore the other directions</h2><p className="mt-2 text-sm text-muted-foreground">Four role families, many ways to make them your own.</p></div><button onClick={request} disabled={generate.isPending || !profile} className="inline-flex items-center gap-2 text-sm font-semibold text-primary" data-testid="button-refresh-roles">{generate.isPending ? <LoaderCircle className="animate-spin" size={16} /> : <Sparkles size={16} />} Refresh role ideas</button></div>
        <div className="mt-6 flex flex-wrap gap-2">{(result ? remaining : allRoles).map((role) => <span key={role} className="rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground" data-testid={`text-explore-role-${role.toLowerCase().replaceAll(/[^a-z]+/g, '-')}`}>{role}</span>)}</div>
      </section>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card/50 px-5 py-4"><span className="text-sm text-muted-foreground">Want to update what we know about you?</span><Link href="/profile-review" className="inline-flex items-center gap-2 text-sm font-semibold text-primary no-underline" data-testid="link-revise-profile">Revise your profile <ArrowRight size={15} /></Link></div>
    </div>
  </Frame>;
}

function Settings({ profile }: { profile: CareerProfileInput | null }) {
  const removeProfile = useDeleteCareerProfile();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState('');
  const deleteData = () => removeProfile.mutate(undefined, { onSuccess: () => { queryClient.setQueryData(getGetCareerProfileQueryKey(), { profile: null }); setConfirm(false); logout(); }, onError: () => setError('Your data was not deleted. Please try again.') });
  return <Frame active="/settings">
    <div className="mx-auto max-w-3xl pt-4">
      <p className="mono text-[10px] uppercase tracking-[.2em] text-primary">Your account, your choice</p>
      <h1 className="serif mt-3 text-5xl leading-tight sm:text-6xl">A little housekeeping.</h1>
      <p className="mt-4 leading-7 text-muted-foreground">Your career exploration belongs to you. Here are the controls for your space.</p>
      <section className="mt-8 rounded-[1.7rem] border border-border bg-card p-6 sm:p-8">
        <h2 className="serif text-3xl">Your profile</h2>
        <p className="mt-2 text-sm text-muted-foreground">{profile ? `${profile.name} · ${profile.city} · ${profile.persona}` : 'No confirmed profile yet.'}</p>
        <Link href={profile ? '/profile-review' : '/onboarding'} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary no-underline" data-testid="link-settings-profile">Review your details <ArrowRight size={15} /></Link>
      </section>
      <section className="mt-5 rounded-[1.7rem] border border-border bg-card p-6 sm:p-8">
        <div className="flex gap-4"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#f3dddd] text-[hsl(var(--destructive))]"><Trash2 size={19} /></div><div><h2 className="serif text-3xl">Delete your account and data</h2><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Permanently remove your account record and saved career profile from this app, then sign out. This does not delete your separate sign-in provider account. This can’t be undone.</p></div></div>
        {error && <div className="mt-5"><Alert>{error}</Alert></div>}
        {confirm ? <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5"><p className="font-semibold text-red-900">Are you sure you want to delete your profile?</p><p className="mt-1 text-sm text-red-800">Your saved details will be removed from this account.</p><div className="mt-4 flex flex-wrap gap-3"><Button variant="danger" onClick={deleteData} disabled={removeProfile.isPending}>{removeProfile.isPending ? <><LoaderCircle className="animate-spin" size={16} /> Deleting…</> : 'Yes, delete my data'}</Button><Button variant="outline" onClick={() => setConfirm(false)}>Keep my data</Button></div></div> :
          <Button variant="outline" className="mt-6 border-[hsl(var(--destructive))/40] text-[hsl(var(--destructive))]" onClick={() => setConfirm(true)} data-testid="button-delete-data">Delete my data</Button>}
        {removeProfile.isSuccess && <div className="mt-4"><Alert kind="success">Your profile was deleted. Signing you out…</Alert></div>}
      </section>
      <section className="mt-5 rounded-[1.7rem] border border-border bg-card p-6 sm:p-8"><h2 className="serif text-3xl">Sign out</h2><p className="mt-2 text-sm text-muted-foreground">Leave your private space on this device.</p><Button variant="outline" onClick={logout} className="mt-5" data-testid="button-sign-out-settings"><LogOut size={16} /> Sign out</Button></section>
    </div>
  </Frame>;
}

function PrivateRouter() {
  const auth = useAuth();
  const [location, setLocation] = useLocation();
  const query = useGetCareerProfile({ query: { enabled: auth.isAuthenticated, queryKey: getGetCareerProfileQueryKey() } });
  const serverProfile = query.data?.profile;
  const [draft, setDraft] = useState<CareerProfileInput>(emptyDraft);
  const [answers, setAnswers] = useState<AnswerEntry[]>([]);
  const [personaGuess, setPersonaGuess] = useState<Persona | null>(null);
  const profileInput = useMemo<CareerProfileInput | null>(() => {
    if (!serverProfile) return null;
    const { id: _id, updatedAt: _updatedAt, ...input } = serverProfile;
    return input;
  }, [serverProfile]);
  const saved = () => {
    queryClient.invalidateQueries({ queryKey: getGetCareerProfileQueryKey() });
    setLocation('/recommendations');
  };
  if (auth.isLoading) return <div className="grid min-h-[100dvh] place-items-center bg-background"><div className="w-[min(90vw,420px)] rounded-[2rem] border border-border bg-card p-8"><LoadingBlock label="Checking your private space" /></div></div>;
  if (!auth.isAuthenticated) return <SignIn />;
  if (query.isLoading && location === '/') return <Welcome profile={null} loading onRetry={() => query.refetch()} />;
  const resolvedDraft = profileInput || draft;
  return <Switch>
    <Route path="/"><Welcome profile={profileInput} loading={query.isLoading} error={query.isError} onRetry={() => query.refetch()} /></Route>
    <Route path="/onboarding"><Onboarding draft={resolvedDraft} setDraft={setDraft} setPersonaGuess={setPersonaGuess} /></Route>
    <Route path="/persona"><PersonaPage draft={resolvedDraft} setDraft={setDraft} personaGuess={personaGuess} /></Route>
    <Route path="/questions"><Questions draft={resolvedDraft} setDraft={setDraft} answers={answers} setAnswers={setAnswers} /></Route>
    <Route path="/profile-review"><ProfileReview draft={resolvedDraft} setDraft={setDraft} onSaved={saved} /></Route>
    <Route path="/recommendations"><Recommendations profile={profileInput} answers={answers} /></Route>
    <Route path="/settings"><Settings profile={profileInput} /></Route>
    <Route component={NotFound} />
  </Switch>;
}

function App() {
  return <QueryClientProvider client={queryClient}>
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <PrivateRouter />
    </WouterRouter>
  </QueryClientProvider>;
}

export default App;
