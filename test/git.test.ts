import { test, expect } from "vitest";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { gatherGitInsights } from "../src/git/insights.js";
import { git, makeTree } from "./helpers.js";

test("git insights use the first commit on HEAD and ignore other branches", async () => {
  const root = makeTree({ "a.ts": "export const a = 1;\n" });
  git(root, ["init", "-q", "-b", "main"]);
  git(root, ["add", "."]);
  git(root, ["commit", "-qm", "first"], "alex", "2020-01-01T00:00:00Z");
  writeFileSync(join(root, "a.ts"), "export const a = 2;\n");
  git(root, ["commit", "-qam", "second"], "alex", "2024-06-01T00:00:00Z");

  git(root, ["checkout", "-qb", "side"]);
  writeFileSync(join(root, "b.ts"), "export const b = 1;\n");
  git(root, ["add", "."]);
  git(root, ["commit", "-qm", "side work"], "sam", "2024-07-01T00:00:00Z");
  git(root, ["checkout", "-q", "main"]);

  const insights = await gatherGitInsights(root);
  expect(insights?.firstCommitDate.startsWith("2020-01-01")).toBe(true);
  expect(insights?.commitCount).toBe(2);
  expect(insights?.contributors).toBe(1);
  expect(insights?.topContributor).toMatchObject({ name: "Alex Example", commits: 2, percentage: 100 });
});
