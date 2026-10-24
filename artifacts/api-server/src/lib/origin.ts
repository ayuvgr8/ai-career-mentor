import type { Request } from 'express';

function toOrigin(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  try {
    return new URL(value.trim()).origin;
  } catch {
    return null;
  }
}

// The public origin(s) this app is served from. APP_ORIGIN may list several
// (comma-separated, e.g. a custom domain plus the platform domain). Render
// injects RENDER_EXTERNAL_URL automatically, so a renamed service or a typo
// in APP_ORIGIN cannot lock every user out of sign-in.
export function configuredOrigins(): string[] {
  const listed = (process.env.APP_ORIGIN ?? '').split(',').map(toOrigin);
  return [...new Set([...listed, toOrigin(process.env.RENDER_EXTERNAL_URL)].filter((o): o is string => Boolean(o)))];
}

/** The canonical public origin: the first configured one. */
export function publicOrigin(): string | null {
  return configuredOrigins()[0] ?? null;
}

// The origin the browser addressed. Behind a proxy this relies on
// `trust proxy` so req.protocol reflects X-Forwarded-Proto.
export function requestOrigin(req: Request): string {
  return `${req.protocol}://${req.get('host')}`;
}

// Same-origin check for cookie-authenticated writes. A browser sets Origin
// and Host itself; a cross-site page cannot make them match this server.
export function isAllowedOrigin(origin: string, req: Request): boolean {
  return origin === requestOrigin(req) || configuredOrigins().includes(origin);
}
