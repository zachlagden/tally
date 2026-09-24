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

test("worker threads produce the same result as a single thread", () => {
  const files: Record<string, string> = {};
  for (let i = 0; i < 400; i++) {
    files[`src/m${i}.ts`] = `export function f${i}(x: number) {\n  if (x > ${i}) return x;\n  return ${i};\n}\n`;
    if (i % 4 === 0) files[`py/m${i}.py`] = `def g${i}(x):\n    # note\n    return x\n`;
  }
  const root = makeTree(files);
  const strip = (out: string) => {
    const parsed = JSON.parse(out) as Record<string, unknown>;
    delete parsed.scanDurationMs;
    return parsed;
  };
  const single = tally(["--json", "--no-git", "--threads", "0", root]);
  const pooled = tally(["--json", "--no-git", "--threads", "3", root]);
  expect(single.status).toBe(0);
  expect(pooled.status).toBe(0);
  expect(strip(pooled.stdout)).toEqual(strip(single.stdout));
  expect((strip(single.stdout) as { fileCount: number }).fileCount).toBe(500);
});

test.skipIf(process.platform === "win32")("closing the output pipe early exits cleanly", () => {
  const files: Record<string, string> = {};
  for (let i = 0; i < 300; i++) files[`m${i}.ts`] = `export const v${i} = ${i};\n`;
  const root = makeTree(files);
  const run = spawnSync("sh", ["-c", `"${process.execPath}" "${CLI}" --json --no-git "${root}" | head -c 10`], { encoding: "utf8" });
  expect(run.stderr).not.toMatch(/EPIPE/);
  expect(run.stdout).toHaveLength(10);
});

test("a file that exceeds --parse-timeout keeps its line counts and is listed in symbolTimeouts", () => {
  const files: Record<string, string> = {};
  for (let i = 0; i < 40; i++) {
    files[`src/m${i}.ts`] = `export function f${i}(x: number) {\n  if (x > ${i}) return x;\n  return ${i};\n}\n`.repeat(40);
  }
  const root = makeTree(files);
  const normal = tally(["--json", "--no-git", "--threads", "2", root]);
  const rushed = tally(["--json", "--no-git", "--threads", "2", "--parse-timeout", "0.001", root]);
  expect(normal.status).toBe(0);
  expect(rushed.status).toBe(0);
  const before = JSON.parse(normal.stdout) as { fileCount: number; totalLines: number; symbolTimeouts: string[] };
  const after = JSON.parse(rushed.stdout) as { fileCount: number; totalLines: number; symbolTimeouts: string[] };
  expect(before.symbolTimeouts).toEqual([]);
  expect(after.symbolTimeouts.length).toBeGreaterThan(0);
  expect(after.symbolTimeouts.every((path) => path.startsWith("src/m"))).toBe(true);
  expect(after.fileCount).toBe(before.fileCount);
  expect(after.totalLines).toBe(before.totalLines);
});

test("--parse-timeout rejects values that are not positive numbers", () => {
  for (const bad of ["0", "-1", "soon"]) {
    const run = tally(["--json", "--parse-timeout", bad, "."]);
    expect(run.status).not.toBe(0);
    expect(run.stderr).toMatch(/positive number of seconds/);
  }
});
