import express, { type Express, type ErrorRequestHandler } from "express";
import path from "node:path";
import { existsSync } from "node:fs";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/authMiddleware";
import { isAllowedOrigin } from "./lib/origin";

const app: Express = express();
// Hosted platforms (Render, Vercel) terminate TLS at a proxy. Without this,
// req.ip is the proxy for every visitor and per-user limits become global.
app.set("trust proxy", process.env.TRUST_PROXY ?? (process.env.NODE_ENV === "production" ? 1 : false));

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
  // The optional voice mentor is the only feature that may use the microphone.
  res.setHeader('Permissions-Policy', 'camera=(), geolocation=(), microphone=(self)');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  if (req.path.startsWith('/api')) res.setHeader('Cache-Control', 'no-store');
  // Cookie-authenticated writes are same-origin only, including the optional guest session.
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const origin = req.get('origin');
    if (req.get('sec-fetch-site') === 'cross-site' || (origin && !isAllowedOrigin(origin, req))) { res.status(403).json({ error: 'Cross-origin requests are not allowed.' }); return; }
  }
  next();
});
app.use(cookieParser());
app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(authMiddleware);

app.use("/api", router);
app.use('/api', (_req, res) => { res.status(404).json({ error: 'Endpoint not found.' }); });
const publicDir = path.resolve(import.meta.dirname, '../../career-mentor/dist/public');
if (existsSync(publicDir)) {
  app.use(express.static(publicDir));
  app.get('/{*path}', (_req, res) => { res.sendFile(path.join(publicDir, 'index.html')); });
}
const handleError: ErrorRequestHandler = (error, req, res, _next) => {
  req.log.error({ errorName: error instanceof Error ? error.name : 'Error' }, 'Request failed');
  if (res.headersSent) { _next(error); return; }
  const status = error?.type === 'entity.too.large' ? 413 : error instanceof SyntaxError ? 400 : 503;
  res.status(status).json({ error: status === 413 ? 'Request is too large.' : status === 400 ? 'Invalid JSON request.' : 'This service is temporarily unavailable. Please try again.' });
};
app.use(handleError);

export default app;
