import app from "./app";
import { logger } from "./lib/logger";
import { publicOrigin } from "./lib/origin";
import { databaseErrorCode, migrateOnBoot } from "./lib/database-status";
import { db, pool, sessionsTable } from '@workspace/db';
import { lt } from 'drizzle-orm';

const origin = publicOrigin();
if (process.env.NODE_ENV === 'production' && (!origin || !origin.startsWith('https://'))) {
  throw new Error('Production requires APP_ORIGIN (or Render\'s RENDER_EXTERNAL_URL) with the public HTTPS origin.');
}

// 5050 avoids macOS ControlCenter/AirPlay's common port-5000 reservation.
// Hosted runtimes still provide PORT explicitly.
const rawPort = process.env["PORT"] || (process.env.NODE_ENV === 'production' ? undefined : '5050');

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const server = app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});

// Listen first so health checks pass and /api/readyz can report why the
// database is unavailable instead of the process crash-looping.
migrateOnBoot().catch((err: unknown) => {
  logger.error({ reason: databaseErrorCode(err), message: err instanceof Error ? err.message : String(err) }, 'Boot migrations failed');
});

// Expired sessions are rejected on read; this sweep keeps the table small.
const sweepSessions = () => {
  db.delete(sessionsTable).where(lt(sessionsTable.expire, new Date()))
    .catch((err: unknown) => logger.warn({ errorName: err instanceof Error ? err.name : 'Error' }, 'Session sweep failed'));
};
setInterval(sweepSessions, 60 * 60 * 1000).unref();
sweepSessions();

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, () => {
    server.close(() => { void pool.end().then(() => process.exit(0)); });
    setTimeout(() => process.exit(1), 10000).unref();
  });
}
