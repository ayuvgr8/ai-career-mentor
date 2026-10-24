import app from "./app";
import { logger } from "./lib/logger";
import { db, pool, sessionsTable } from '@workspace/db';
import { lt } from 'drizzle-orm';

if (process.env.NODE_ENV === 'production' && (!process.env.APP_ORIGIN || new URL(process.env.APP_ORIGIN).protocol !== 'https:')) {
  throw new Error('Production requires APP_ORIGIN with the public HTTPS origin.');
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
