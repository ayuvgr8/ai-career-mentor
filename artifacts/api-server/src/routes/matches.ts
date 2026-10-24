import { Router } from "express";
import { eq } from "drizzle-orm";
import { careerMatchesTable, careerProfilesTable, db } from "@workspace/db";
import {
  CareerOpenedBody,
  CareerReactionBody,
  type CareerMatchesView,
} from "@workspace/api-zod";
import { fingerprint } from "../lib/plan-validation";

const MAX_OPENED = 40;

const router = Router();
router.use("/career/matches", (req, res, next) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Sign in to continue." });
    return;
  }
  next();
});

async function loadMatches(userId: string) {
  const [row] = await db
    .select()
    .from(careerMatchesTable)
    .where(eq(careerMatchesTable.userId, userId));
  return row;
}

router.get("/career/matches", async (req, res) => {
  const userId = req.user!.id;
  const [row, [profile]] = await Promise.all([
    loadMatches(userId),
    db
      .select()
      .from(careerProfilesTable)
      .where(eq(careerProfilesTable.userId, userId)),
  ]);
  const view: CareerMatchesView = {
    recommendations: row?.recommendations ?? [],
    // A changed profile means the saved top three no longer reflects it.
    stale:
      !profile ||
      !row?.profileFingerprint ||
      fingerprint(profile.profile) !== row.profileFingerprint,
    reactions: row?.reactions ?? {},
    opened: row?.opened ?? [],
  };
  res.json(view);
});

router.put("/career/matches/reactions", async (req, res) => {
  const parsed = CareerReactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Choose a role and a reaction." });
    return;
  }
  const userId = req.user!.id;
  const reactions = { ...((await loadMatches(userId))?.reactions ?? {}) };
  if (parsed.data.reaction) reactions[parsed.data.role] = parsed.data.reaction;
  else delete reactions[parsed.data.role];
  await db
    .insert(careerMatchesTable)
    .values({ userId, reactions })
    .onConflictDoUpdate({
      target: careerMatchesTable.userId,
      set: { reactions, updatedAt: new Date() },
    });
  res.json({ reactions });
});

router.post("/career/matches/opened", async (req, res) => {
  const parsed = CareerOpenedBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Choose a valid role." });
    return;
  }
  const userId = req.user!.id;
  const previous = (await loadMatches(userId))?.opened ?? [];
  const opened = [
    parsed.data.slug,
    ...previous.filter((slug) => slug !== parsed.data.slug),
  ].slice(0, MAX_OPENED);
  await db
    .insert(careerMatchesTable)
    .values({ userId, opened })
    .onConflictDoUpdate({
      target: careerMatchesTable.userId,
      set: { opened, updatedAt: new Date() },
    });
  res.json({ opened });
});

export default router;
