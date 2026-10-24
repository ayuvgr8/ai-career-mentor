import type { RequestHandler } from "express";

// Instance-local guard; deployments with multiple replicas must also enforce a shared gateway limit.
export function requestLimit(limit: number, windowMs: number): RequestHandler {
  const buckets = new Map<string, { count: number; expires: number }>();
  return (req, res, next) => {
    const now = Date.now();
    for (const [key, bucket] of buckets)
      if (bucket.expires <= now) buckets.delete(key);
    const key = req.user?.id || req.ip || "unknown";
    const bucket = buckets.get(key) || { count: 0, expires: now + windowMs };
    if (bucket.count >= limit || (!buckets.has(key) && buckets.size >= 10000)) {
      res.setHeader(
        "Retry-After",
        Math.max(1, Math.ceil((bucket.expires - now) / 1000)),
      );
      res
        .status(429)
        .json({
          error: "Too many requests. Please pause before trying again.",
        });
      return;
    }
    bucket.count++;
    buckets.set(key, bucket);
    next();
  };
}
