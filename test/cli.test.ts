import { test, expect } from "vitest";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { makeTree } from "./helpers.js";

const CLI = join(dirname(fileURLToPath(import.meta.url)), "..", "dist", "cli.js");

function tally(args: string[]) {
  return spawnSync(process.execPath, [CLI, ...args], { encoding: "utf8" });
}

test("--top rejects values that are not positive whole numbers", () => {
  for (const bad of ["abc", "0", "2.5"]) {
    const run = tally(["--json", "--top", bad, "."]);
    expect(run.status).not.toBe(0);
    expect(run.stderr).toMatch(/whole number/);
  }
});

test("--lang rejects unknown language ids and lists the known ones", () => {
  const run = tally(["--json", "--lang", "typescript,klingon", "."]);
  expect(run.status).not.toBe(0);
  expect(run.stderr).toMatch(/unknown language id "klingon"/);
  expect(run.stderr).toMatch(/typescript/);
});

test("--version reports the package version", () => {
  const run = tally(["--version"]);
  expect(run.stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/);
});

test("closing the output pipe early exits cleanly", () => {
  const files: Record<string, string> = {};
  for (let i = 0; i < 300; i++) files[`m${i}.ts`] = `export const v${i} = ${i};\n`;
  const root = makeTree(files);
  const run = spawnSync("sh", ["-c", `"${process.execPath}" "${CLI}" --json --no-git "${root}" | head -c 10`], { encoding: "utf8" });
  expect(run.stderr).not.toMatch(/EPIPE/);
  expect(run.stdout).toHaveLength(10);
});
