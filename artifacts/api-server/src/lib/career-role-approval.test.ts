import assert from "node:assert/strict";
import { test } from "node:test";
import { careerRoleSeeds } from "./career-role-seeds";

test("only the four content-owner-approved guides lose their draft labels", () => {
  const approved = new Set([
    "front-end-engineer",
    "performance-marketing",
    "product-design",
    "core-product-manager",
  ]);
  assert.equal(careerRoleSeeds.filter((role) => role.status === "approved").length, approved.size);
  for (const role of careerRoleSeeds) {
    assert.ok(role.content);
    if (approved.has(role.slug)) {
      assert.equal(role.status, "approved", role.slug);
      assert.equal(role.content.label, null, role.slug);
    } else {
      assert.equal(role.status, "illustrative", role.slug);
      assert.equal(role.content.label, "Illustrative first draft", role.slug);
    }
  }
});
