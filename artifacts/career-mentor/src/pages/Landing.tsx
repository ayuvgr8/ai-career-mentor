import { useEffect } from 'react';
import { landing as c } from '@/content/landing';
import './Landing.css';

function loginHref(): string {
  const base = document.querySelector('meta[name="app-base-path"]')?.getAttribute('content') || '/';
  return `/api/login?returnTo=${encodeURIComponent(base)}`;
}

function Landing() {
  const login = loginHref();
  useEffect(() => {
    document.documentElement.classList.add('lp-mounted');
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500&family=Inter:wght@400;500;600&display=swap';
    link.setAttribute('data-landing-fonts', '');
    document.head.appendChild(link);
    return () => {
      document.documentElement.classList.remove('lp-mounted');
      link.remove();
    };
  }, []);
  const year = new Date().getFullYear();
  return (
    <div className="lp">
      <header className="wrap bar">
        <div className="bar-l">
          <a href="#top" className="mark serif" data-testid="link-landing-brand">{c.brand.name}</a>
          <nav className="anchors" aria-label="Sections">
            {c.nav.links.map((l) => <a key={l.href} href={l.href} data-testid={`link-landing-${l.label.toLowerCase().replace(/\s+/g, '-')}`}>{l.label}</a>)}
          </nav>
        </div>
        <div className="bar-r">
          <a href={login} className="signin" data-testid="link-landing-signin">{c.nav.signIn}</a>
          <a href={login} className="pill" data-testid="link-landing-try">{c.nav.cta}</a>
        </div>
      </header>
      <main id="top">
        <section className="panel" id="product" aria-label={c.hero.label}>
          <div className="fan">
            {c.hero.cards.map((card, i) => {
              const inner = (
                <>
                  <span className="micro">{card.label}</span>
                  <h2 className="serif">{card.role}</h2>
                  <p>{card.line}</p>
                  <span className="chip">{card.tag}</span>
                </>
              );
              const cls = `card c${i}${card.cta ? ' center' : ''}`;
              return card.cta
                ? <a key={i} href={login} className={cls} data-testid="link-landing-hero-card">{inner}</a>
                : <div key={i} className={cls}>{inner}</div>;
            })}
          </div>
          <div className="clouds" aria-hidden="true" />
        </section>
        <section className="wrap intro">
          <p className="micro eyebrow">{c.intro.eyebrow}</p>
          <h1><span className="u p">{c.intro.headlineA}</span> <span className="u b">{c.intro.headlineB}</span>{c.intro.headlineEnd}</h1>
          <p className="support">{c.intro.support}</p>
          <div className="stats">
            {c.intro.stats.map((s) => <div className="stat" key={s.label}><b>{s.value}</b><span className="micro">{s.label}</span></div>)}
          </div>
          <a href={login} className="pill white intro-cta" data-testid="link-landing-intro-try">{c.intro.cta}</a>
        </section>
        <section className="wrap sec" id="how">
          <h2 className="t">{c.how.title}</h2>
          <ol className="steps">
            {c.how.steps.map((s) => <li className="step" key={s.n}><div className="n" aria-hidden="true">{s.n}</div><h3>{s.title}</h3><p>{s.line}</p></li>)}
          </ol>
          <p className="note">{c.how.note}</p>
        </section>
        <section className="wrap sec" id="paths">
          <h2 className="t">{c.paths.title}</h2>
          <div className="two">
            {c.paths.cards.map((p) => (
              <article className="path" key={p.label}>
                <h3>{p.label}</h3>
                <ul>{p.points.map((pt) => <li key={pt}>{pt}</li>)}</ul>
                <a href={login} className="pill" data-testid={`link-landing-start-${p.label.toLowerCase().replace(/\s+/g, '-')}`}>{p.cta}</a>
              </article>
            ))}
          </div>
        </section>
      </main>
      <footer>
        <div className="wrap">
          <span className="serif" style={{ fontSize: 18, color: 'var(--ink)' }}>{c.brand.name}</span>
          <span>{c.footer.line}</span>
          <a href={login} data-testid="link-landing-footer-signin">{c.footer.signIn}</a>
          <span>{year}</span>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
