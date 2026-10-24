import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'wouter';
import type { CareerRoleRecord, CareerRoleContent } from '@workspace/api-client-react';
import { ArrowRight, Check, Columns3, Plus, X } from 'lucide-react';

const MAX = 3;
const PARAM = 'compare';

type ReadyRole = CareerRoleRecord & { content: CareerRoleContent };
const isReady = (r: CareerRoleRecord): r is ReadyRole => r.status !== 'coming' && Boolean(r.content);

function readSlugs(valid: Set<string>): string[] {
  const raw = new URLSearchParams(window.location.search).get(PARAM) || '';
  const out: string[] = [];
  for (const s of raw.split(',').map((x) => x.trim())) {
    if (s && valid.has(s) && !out.includes(s)) out.push(s);
    if (out.length === MAX) break;
  }
  return out;
}

function writeSlugs(slugs: string[]) {
  const url = new URL(window.location.href);
  if (slugs.length) url.searchParams.set(PARAM, slugs.join(','));
  else url.searchParams.delete(PARAM);
  window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
}

function Bullets({ items, testId }: { items: string[]; testId: string }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">Not listed in this guide.</p>;
  return <ul className="space-y-1.5" data-testid={testId}>{items.map((item, i) => <li key={i} className="flex gap-2 text-sm leading-6"><span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" aria-hidden />{item}</li>)}</ul>;
}

function SubHead({ children }: { children: ReactNode }) {
  return <p className="mono mb-2 mt-4 text-[9px] uppercase tracking-[.16em] text-primary first:mt-0">{children}</p>;
}

const sections: { key: string; title: string; render: (c: CareerRoleContent, slug: string) => ReactNode }[] = [
  { key: 'why', title: 'Why it might fit', render: (c, s) => <p className="text-sm leading-6" data-testid={`text-compare-why-${s}`}>{c.whyItFits}</p> },
  { key: 'day', title: 'A day, in nine blocks', render: (c, s) => <ol className="space-y-2" data-testid={`list-compare-day-${s}`}>{c.dayInLife.map((b, i) => <li key={i} className="grid grid-cols-[4.5rem_1fr] gap-2 text-sm leading-6"><span className="mono pt-0.5 text-[11px] text-muted-foreground">{b.time}</span><span>{b.activity}</span></li>)}</ol> },
  { key: 'metrics', title: 'How the work is measured', render: (c, s) => <Bullets items={c.metrics} testId={`list-compare-metrics-${s}`} /> },
  { key: 'stakeholders', title: 'Who you work with', render: (c, s) => <Bullets items={c.stakeholders} testId={`list-compare-stakeholders-${s}`} /> },
  { key: 'journey', title: 'Learning journey', render: (c, s) => <ol className="space-y-3 border-l border-primary/25 pl-4" data-testid={`list-compare-journey-${s}`}>{c.journey.map((j, i) => <li key={i} className="relative text-sm leading-6"><span className="absolute -left-[21px] top-2 h-2 w-2 rounded-full bg-primary" aria-hidden /><p className="mono text-[10px] uppercase tracking-[.12em] text-primary">{j.period}</p><p className="font-semibold">{j.focus}</p><p className="text-muted-foreground">Evidence: {j.evidence}</p></li>)}</ol> },
  { key: 'ai', title: 'Where AI is changing it', render: (c, s) => <div data-testid={`section-compare-ai-${s}`}><SubHead>What is changing</SubHead><p className="text-sm leading-6">{c.aiImpact.changing}</p><SubHead>Tasks to watch</SubHead><Bullets items={c.aiImpact.tasksToWatch} testId={`list-compare-ai-tasks-${s}`} /><SubHead>The human edge</SubHead><Bullets items={c.aiImpact.humanEdge} testId={`list-compare-ai-human-${s}`} /></div> },
  { key: 'entry', title: 'Ways in', render: (c, s) => <div data-testid={`section-compare-entry-${s}`}><SubHead>Foundation</SubHead><Bullets items={c.entryRequirements.foundation} testId={`list-compare-entry-foundation-${s}`} /><SubHead>Helpful</SubHead><Bullets items={c.entryRequirements.helpful} testId={`list-compare-entry-helpful-${s}`} /><SubHead>Proof of work</SubHead><Bullets items={c.entryRequirements.proofOfWork} testId={`list-compare-entry-proof-${s}`} /></div> },
];

export function RoleCompare({ roles }: { roles: CareerRoleRecord[] }) {
  const ready = useMemo(() => roles.filter(isReady).sort((a, b) => a.familyTitle.localeCompare(b.familyTitle) || a.sortOrder - b.sortOrder), [roles]);
  const validKey = ready.map((r) => r.slug).join('|');
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => { setSelected(readSlugs(new Set(validKey.split('|').filter(Boolean)))); }, [validKey]);

  const update = (next: string[]) => { setSelected(next); writeSlugs(next); };
  const toggle = (slug: string) => {
    if (selected.includes(slug)) update(selected.filter((s) => s !== slug));
    else if (selected.length < MAX) update([...selected, slug]);
  };
  const chosen = selected.map((s) => ready.find((r) => r.slug === s)).filter((r): r is ReadyRole => Boolean(r));
  const full = selected.length >= MAX;

  return <section className="mt-16 border-t border-border pt-10" aria-labelledby="compare-heading" data-testid="section-role-compare">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="mono flex items-center gap-2 text-[10px] uppercase tracking-[.2em] text-primary"><Columns3 size={13} aria-hidden /> Side by side</p>
        <h2 id="compare-heading" className="serif mt-3 text-4xl leading-tight sm:text-5xl">Hold two or three paths up to the light.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Pick roles from any family. The same parts of each guide line up in rows, so differences are easier to notice. On a smaller screen, scroll the comparison sideways to see each role.</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="mono rounded-full border border-border bg-card/70 px-3 py-2 text-[10px] uppercase tracking-[.14em]" aria-live="polite" data-testid="status-compare-count">{selected.length} of {MAX} selected</span>
        {selected.length > 0 && <button type="button" onClick={() => update([])} className="rounded-full px-3 py-2 text-xs font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" data-testid="button-compare-clear">Clear all</button>}
      </div>
    </div>

    {ready.length < 2 ? <div className="mt-7 rounded-[1.5rem] border border-dashed border-border bg-card/60 p-7 text-sm leading-6 text-muted-foreground" data-testid="status-compare-unavailable">Comparison opens once at least two role guides are ready. {ready.length === 1 ? 'One guide is available so far.' : 'No guides are available yet.'}</div> : <>
      <div className="mt-7 flex flex-wrap gap-2" role="group" aria-label="Choose roles to compare" data-testid="list-compare-options">
        {ready.map((r) => {
          const on = selected.includes(r.slug);
          const disabled = !on && full;
          return <button key={r.slug} type="button" aria-pressed={on} disabled={disabled} onClick={() => toggle(r.slug)}
            className={`group inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border px-4 py-2.5 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-45 ${on ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card/80 hover:border-primary/50'}`}
            data-testid={`button-compare-select-${r.slug}`} title={disabled ? `You can compare up to ${MAX} roles` : undefined}>
            {on ? <Check size={14} aria-hidden /> : <Plus size={14} aria-hidden className="text-primary" />}
            <span className="font-semibold">{r.title}</span><span className={`mono text-[9px] uppercase tracking-[.12em] ${on ? 'text-primary-foreground/75' : 'text-muted-foreground'}`}>{r.familyTitle}</span>
          </button>;
        })}
      </div>
      {full && <p className="mt-3 text-xs text-muted-foreground" data-testid="text-compare-limit">That is the limit of {MAX}. Remove one to swap in another.</p>}

      {chosen.length < 2 ? <div className="mt-7 rounded-[1.5rem] border border-dashed border-border bg-card/60 p-8 text-center" data-testid="status-compare-empty">
        <div className="mx-auto flex w-fit gap-2" aria-hidden>{[0, 1, 2].map((i) => <span key={i} className={`h-14 w-10 rounded-xl border ${i < chosen.length ? 'border-primary bg-primary/15' : 'border-dashed border-border'}`} />)}</div>
        <p className="serif mt-4 text-2xl">{chosen.length === 0 ? 'Choose two roles to begin' : `Add one more to compare with ${chosen[0].title}`}</p>
        <p className="mt-1 text-sm text-muted-foreground">You can line up as many as {MAX}.</p>
      </div> :
        <div className="mt-7 overflow-x-auto rounded-[1.5rem] border border-border bg-card/70" role="region" aria-label="Role comparison" tabIndex={0} data-testid="region-role-comparison">
          <div className="grid min-w-full" style={{ gridTemplateColumns: `repeat(${chosen.length}, minmax(16rem, 1fr))` }}>
            {chosen.map((r) => <div key={r.slug} className="sticky top-0 flex flex-col gap-3 border-b border-l border-border bg-[#e7eee7] p-5 first:border-l-0" data-testid={`card-compare-role-${r.slug}`}>
              <div className="flex items-start justify-between gap-3">
                <div><p className="mono text-[9px] uppercase tracking-[.14em] text-primary">{r.familyTitle}</p><h3 className="serif mt-1 text-2xl leading-tight" data-testid={`text-compare-title-${r.slug}`}>{r.title}</h3></div>
                <button type="button" onClick={() => toggle(r.slug)} aria-label={`Remove ${r.title} from comparison`} className="rounded-full border border-border bg-card p-1.5 text-muted-foreground hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" data-testid={`button-compare-remove-${r.slug}`}><X size={14} /></button>
              </div>
              <span className="mono w-fit rounded-full border border-border bg-card/70 px-2.5 py-1 text-[9px] uppercase tracking-[.12em] text-muted-foreground" data-testid={`status-compare-label-${r.slug}`}>{r.content.label}</span>
              <Link href={`/roles/${r.slug}`} className="inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-primary no-underline hover:underline" data-testid={`link-compare-guide-${r.slug}`}>Open full guide <ArrowRight size={13} /></Link>
            </div>)}
            {sections.map((sec) => <div key={sec.key} className="contents">
              <div className="col-span-full border-b border-border bg-background/60 px-5 py-2.5" style={{ gridColumn: `1 / span ${chosen.length}` }}><h4 className="mono text-[10px] uppercase tracking-[.18em] text-primary" data-testid={`text-compare-section-${sec.key}`}>{sec.title}</h4></div>
              {chosen.map((r) => <div key={r.slug} className="border-b border-l border-border p-5 [&:nth-child(2)]:border-l-0" aria-label={`${r.title}: ${sec.title}`} data-testid={`cell-compare-${sec.key}-${r.slug}`}><p className="mono mb-3 text-[10px] text-primary sm:hidden">{r.title}</p>{sec.render(r.content, r.slug)}</div>)}
            </div>)}
          </div>
        </div>}
    </>}
  </section>;
}
