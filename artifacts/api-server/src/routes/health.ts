import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { pool } from "@workspace/db";

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
      new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000)),
    ]);
    res.json({ status: "ok", database: "ok" });
  } catch (error) {
    req.log.warn({ errorName: error instanceof Error ? error.name : "Error" }, "Readiness check failed");
    res.status(503).json({ status: "unavailable", database: "unreachable" });
  }
});

export default router;
