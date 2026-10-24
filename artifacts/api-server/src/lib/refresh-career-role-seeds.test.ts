import assert from "node:assert/strict";
import { after, test } from "node:test";
import { careerRolesTable, db, pool, type InsertCareerRole } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { careerRoleSeeds } from "./career-role-seeds";
import { refreshCareerRoleSeeds } from "./refresh-career-role-seeds";

after(() => pool.end());

test("refresh inserts guides, replaces drafts, and preserves approved copy", async () => {
  await db.transaction(async (tx) => {
    // PostgreSQL resolves unqualified career_roles to this connection-local table.
    // No application rows are read or changed; the table disappears on commit.
    await tx.execute(sql`
      CREATE TEMP TABLE career_roles (
        slug varchar(100) PRIMARY KEY,
        family_slug varchar(100) NOT NULL,
        family_title varchar(150) NOT NULL,
        title varchar(150) NOT NULL,
        summary varchar(500) NOT NULL,
        status varchar(30) NOT NULL,
        sort_order integer NOT NULL,
        content jsonb,
        updated_at timestamptz NOT NULL DEFAULT now()
      ) ON COMMIT DROP
    `);
    await refreshCareerRoleSeeds(tx);
    assert.equal((await tx.select().from(careerRolesTable)).length, careerRoleSeeds.length);

    const base = careerRoleSeeds.find((role) => role.slug === "back-end-engineer")!;
    assert.ok(base.content);
    const incoming = {
      ...base,
      content: { ...base.content, whyItFits: "Refreshed draft copy" },
    };
    await refreshCareerRoleSeeds(tx, [incoming]);
    const read = async (slug = base.slug) =>
      (await tx.select().from(careerRolesTable).where(eq(careerRolesTable.slug, slug)))[0];
    assert.deepEqual((await read()).content, incoming.content, "existing draft refreshes");

    const approved = { ...incoming.content, label: null, whyItFits: "Owner-approved copy" };
    await tx.update(careerRolesTable).set({ status: "approved", content: approved })
      .where(eq(careerRolesTable.slug, base.slug));
    const before = await read();
    await refreshCareerRoleSeeds(tx, [base]);
    assert.deepEqual(await read(), before, "stale draft cannot undo approval");
    await refreshCareerRoleSeeds(tx, [{ ...incoming, status: "approved", content: { ...approved, whyItFits: "New seed copy" } }]);
    assert.deepEqual(await read(), before, "new approved seed cannot overwrite reviewed copy");

    const cases = [
      { status: "coming", label: null, contentMissing: true, updates: true },
      { status: "illustrative", label: null, updates: false },
      { status: "illustrative", label: "Reviewed by owner", updates: false },
      { status: "illustrative", label: null, contentMissing: true, updates: false },
      { status: "approved", label: "Illustrative first draft", updates: false },
    ];
    for (const [index, scenario] of cases.entries()) {
      const slug = `refresh-case-${index}`;
      const stored: InsertCareerRole = {
        ...base, slug, status: scenario.status,
        content: scenario.contentMissing ? null : { ...base.content, label: scenario.label },
      };
      await tx.insert(careerRolesTable).values(stored);
      const previous = await read(slug);
      const next = { ...incoming, slug, status: "approved", content: approved };
      await refreshCareerRoleSeeds(tx, [next]);
      const actual = await read(slug);
      if (scenario.updates) {
        assert.equal(actual.status, next.status);
        assert.deepEqual(actual.content, next.content);
      } else {
        assert.deepEqual(actual, previous, JSON.stringify(scenario));
      }
    }

    // A draft can adopt the now-approved seed, then becomes immutable on refresh.
    await tx.update(careerRolesTable).set({ status: "illustrative", content: base.content })
      .where(eq(careerRolesTable.slug, base.slug));
    await refreshCareerRoleSeeds(tx, [{ ...base, status: "approved", content: approved }]);
    assert.equal((await read()).status, "approved");
    assert.deepEqual((await read()).content, approved);
    const final = await read();
    await refreshCareerRoleSeeds(tx);
    assert.deepEqual(await read(), final, "repeated catalog refresh preserves approval");
  });
});
