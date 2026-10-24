import assert from "node:assert/strict";
import { test } from "node:test";
import { careerRoleSeeds } from "./career-role-seeds";

function text(value: unknown, field: string) {
  assert.equal(typeof value, "string", field);
  assert.ok((value as string).trim().length > 0, `${field} must not be blank`);
}

function textList(value: unknown, field: string) {
  assert.ok(Array.isArray(value), field);
  assert.ok(value.length > 0, `${field} must not be empty`);
  value.forEach((item, index) => text(item, `${field}[${index}]`));
}

// These were the original four illustrative guides. Their copy is now approved;
// approval must not weaken the structural checks or restore their draft labels.
const selectedSlugs = [
  "front-end-engineer",
  "performance-marketing",
  "product-design",
  "core-product-manager",
];

test("the four selected guides exist exactly once", () => {
  for (const slug of selectedSlugs) {
    assert.equal(careerRoleSeeds.filter((role) => role.slug === slug).length, 1, slug);
  }
});

// Also cover the remaining drafts so future catalog edits cannot omit a section.
for (const role of careerRoleSeeds) {
  test(`${role.slug}: complete guide sections and correct approval label`, () => {
    const content = role.content;
    assert.ok(content, "guide content");
    text(content.whyItFits, "whyItFits");
    assert.equal(content.dayInLife.length, 9, "nine day blocks");
    content.dayInLife.forEach((block, index) => {
      text(block.time, `dayInLife[${index}].time`);
      text(block.activity, `dayInLife[${index}].activity`);
    });
    assert.equal(new Set(content.dayInLife.map((block) => block.time)).size, 9);
    assert.equal(content.journey.length, 5, "five learning stages");
    content.journey.forEach((stage, index) => {
      text(stage.period, `journey[${index}].period`);
      text(stage.focus, `journey[${index}].focus`);
      text(stage.evidence, `journey[${index}].evidence`);
    });
    assert.equal(new Set(content.journey.map((stage) => stage.period)).size, 5);
    textList(content.metrics, "metrics");
    textList(content.stakeholders, "stakeholders");
    assert.ok(content.aiImpact, "AI impact");
    text(content.aiImpact.changing, "aiImpact.changing");
    textList(content.aiImpact.tasksToWatch, "aiImpact.tasksToWatch");
    textList(content.aiImpact.humanEdge, "aiImpact.humanEdge");
    assert.ok(content.entryRequirements, "entry requirements");
    assert.ok(content.practiceProject, "practice project");
    for (const key of ["title", "timebox", "deliverable", "reflection"] as const) {
      text(content.practiceProject[key], `practiceProject.${key}`);
    }
    textList(content.practiceProject.materials, "practiceProject.materials");
    assert.equal(content.practiceProject.steps.length, 3, "three bounded practice steps");
    textList(content.practiceProject.steps, "practiceProject.steps");
    assert.match(content.practiceProject.timebox, /^\d+–\d+ hours$/);
    assert.match(content.practiceProject.deliverable, /^Stop at /);
    for (const key of ["foundation", "helpful", "proofOfWork"] as const) {
      textList(content.entryRequirements[key], `entryRequirements.${key}`);
    }
    const approved = selectedSlugs.includes(role.slug);
    assert.equal(role.status, approved ? "approved" : "illustrative");
    assert.equal(content.label, approved ? null : "Illustrative first draft");
  });
}
