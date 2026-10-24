import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { pool } from "@workspace/db";
import { databaseErrorCode } from "../lib/database-status";

const router: IRouter = Router();

// Liveness: the process is up. Kept cheap for platform health checks.
router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

// Readiness: the database answers. Use for load balancers and smoke tests.
router.get("/readyz", async (req, res) => {
  try {
    await Promise.race([
      pool.query("SELECT 1"),
      new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error("timeout"), { code: "TIMEOUT" })), 8000)),
    ]);
    res.json({ status: "ok", database: "ok" });
  } catch (error) {
    const reason = databaseErrorCode(error);
    req.log.warn({ reason, message: error instanceof Error ? error.message : String(error) }, "Readiness check failed");
    // The code (e.g. ENOTFOUND, ETIMEDOUT, 28P01, 3D000) is enough to fix the
    // deployment and carries no connection details or secrets.
    res.status(503).json({ status: "unavailable", database: "unreachable", reason });
  }
});

export default router;
