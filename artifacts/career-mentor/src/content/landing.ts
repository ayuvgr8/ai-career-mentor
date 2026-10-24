import { PRODUCT_NAME, TAGLINE } from '@/config/brand';

export const landing = {
  nav: {
    links: [
      { label: 'Product', href: '#product' },
      { label: 'How it works', href: '#how' },
      { label: 'For you', href: '#paths' },
    ],
    signIn: 'Sign in',
    cta: 'Try a role',
  },
  hero: {
    label: 'Four careers and a way in',
    cards: [
      { label: 'Engineering', role: 'Software Engineer', line: 'Ship a feature, break the build, fix it before standup.', tag: 'Day preview' },
      { label: 'Marketing', role: 'Marketing', line: 'Plan a launch, read the numbers, kill the losing ad.', tag: 'Day preview' },
      { label: 'Start here', role: 'Your next role?', line: 'Answer a few questions, get your top 3.', tag: 'Try it', cta: true },
      { label: 'Content and design', role: 'Content + Design', line: 'Brief, draft, scrap it, find the idea that works.', tag: 'Day preview' },
      { label: 'Product', role: 'Product Manager', line: 'Say no politely, then align three teams on one row.', tag: 'Day preview' },
    ],
  },
  intro: {
    eyebrow: 'For students and early-career professionals in India',
    headlineA: TAGLINE.slice(0, TAGLINE.indexOf(' before')),
    headlineB: TAGLINE.slice(TAGLINE.indexOf('before'), -1),
    headlineEnd: TAGLINE.slice(-1),
    support: 'Answer a few questions, get your top 3 roles, and preview an illustrative workday in one - before you spend months chasing it.',
    stats: [
      { value: '4', label: 'careers to explore' },
      { value: '9 hrs', label: 'illustrative workday preview' },
    ],
    cta: 'Try a role',
  },
  how: {
    title: 'How it works',
    steps: [
      { n: '1', title: 'Tell us about yourself', line: 'Upload a resume or answer a few tap-card questions.' },
      { n: '2', title: 'Get your top 3 roles', line: 'Matched to your interests, strengths and constraints.' },
      { n: '3', title: 'Preview the day', line: 'An illustrative hour-by-hour workday in one role.' },
    ],
    note: 'Day previews are illustrative - a feel for the work, not work experience.',
  },
  paths: {
    title: 'Two ways in',
    cards: [
      { label: 'For students', points: ['No resume needed.', 'Questions about what you enjoy and what feels like a chore.', 'See roles before you pick a stream, internship or first job.'], cta: 'Start' },
      { label: 'For working professionals', points: ['Your resume pre-fills your profile.', 'Questions about your current work.', 'See whether to grow in your domain or switch.'], cta: 'Start' },
    ],
  },
  footer: { line: 'Made for students and early-career professionals in India.', signIn: 'Sign in' },
  brand: { name: PRODUCT_NAME, tagline: TAGLINE },
};
