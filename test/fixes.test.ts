import { test, expect } from "vitest";
import { chmodSync } from "node:fs";
import { join } from "node:path";
import { countLines } from "../src/scan/countLines.js";
import { scan } from "../src/scan/index.js";
import { git, makeTree } from "./helpers.js";

const baseOptions = { topN: 10, includeSymbols: true, includeGit: false };

test("a trailing newline does not add a phantom line", () => {
  expect(countLines("a = 1\nb = 2\n", "python")).toEqual({ lines: 2, codeLines: 2, blankLines: 0, commentLines: 0 });
  expect(countLines("a = 1\nb = 2", "python").lines).toBe(2);
  expect(countLines("", "python").lines).toBe(0);
  expect(countLines("\n", "python")).toEqual({ lines: 1, codeLines: 0, blankLines: 1, commentLines: 0 });
});

test("blank lines inside a block comment do not reduce the comment count", () => {
  const source = "/*\nfoo\n\nbar\n*/\nint x;\n";
  expect(countLines(source, "c")).toEqual({ lines: 6, codeLines: 1, blankLines: 1, commentLines: 4 });
});

test("lockfiles are not counted", async () => {
  const root = makeTree({
    "index.ts": "export const a = 1;\n",
    "pnpm-lock.yaml": "lockfileVersion: '9.0'\n",
    "package-lock.json": "{}\n",
    "go.sum": "example.com/mod v1.0.0 h1:abc=\n",
  });
  const result = await scan({ root, ...baseOptions });
  expect(result.files.map((f) => f.path)).toEqual(["index.ts"]);
});

test("progress reaches the total exactly once and never exceeds it", async () => {
  const root = makeTree({
    "a.ts": "const a = 1;\n",
    "b.py": "b = 2\n",
    "notes.unknownext": "ignored\n",
    "LICENSE": "MIT\n",
  });
  const seen: Array<[number, number]> = [];
  await scan({ root, ...baseOptions, onProgress: (current, total) => seen.push([current, total]) });
  const total = seen[0]![1];
  expect(seen.every(([current]) => current <= total)).toBe(true);
  expect(seen.filter(([current]) => current === total)).toHaveLength(1);
});

test.skipIf(process.platform === "win32" || process.getuid?.() === 0)("unreadable files are reported instead of silently dropped", async () => {
  const root = makeTree({ "ok.ts": "const a = 1;\n", "locked.ts": "const b = 2;\n" });
  chmodSync(join(root, "locked.ts"), 0o000);
  const result = await scan({ root, ...baseOptions });
  expect(result.files.map((f) => f.path)).toEqual(["ok.ts"]);
  expect(result.skippedFiles.map((f) => f.path)).toEqual(["locked.ts"]);
  expect(result.skippedFiles[0]!.reason).toMatch(/EACCES/);
});

test("scanning a subfolder of a git repo respects .gitignore and keeps git insights", async () => {
  const root = makeTree({
    ".gitignore": "generated.ts\n",
    "pkg/src/main.ts": "export const main = 1;\n",
    "pkg/src/generated.ts": "export const generated = 1;\n",
    "pkg/.eslintrc.js": "module.exports = {};\n",
  });
  git(root, ["init", "-q"]);
  git(root, ["add", "."]);
  git(root, ["commit", "-qm", "init"]);
  const result = await scan({ root: join(root, "pkg"), ...baseOptions, includeGit: true });
  expect(result.files.map((f) => f.path).sort()).toEqual([".eslintrc.js", "src/main.ts"]);
  expect(result.git?.commitCount).toBe(1);
});

test("dotfiles are counted outside git repos too", async () => {
  const root = makeTree({ ".eslintrc.js": "module.exports = {};\n", "main.ts": "export {};\n" });
  const result = await scan({ root, ...baseOptions });
  expect(result.files.map((f) => f.path).sort()).toEqual([".eslintrc.js", "main.ts"]);
});

test("extensionless scripts are classified by shebang", async () => {
  const root = makeTree({
    "bin/deploy": "#!/usr/bin/env python3\nprint('hi')\n",
    "bin/run": "#!/bin/bash\necho hi\n",
    "LICENSE": "MIT License\n",
  });
  const result = await scan({ root, ...baseOptions });
  const byPath = Object.fromEntries(result.files.map((f) => [f.path, f.language]));
  expect(byPath).toEqual({ "bin/deploy": "python", "bin/run": "bash" });
});

test("files with a text extension but binary content are ignored", async () => {
  const root = makeTree({ "real.ts": "const a = 1;\n", "fake.ts": "const\u0000binary" });
  const result = await scan({ root, ...baseOptions });
  expect(result.files.map((f) => f.path)).toEqual(["real.ts"]);
});

test("files too large to parse are flagged, and moderately large files are still parsed", async () => {
  const fn = "function f() { if (x) { return 1; } }\n";
  const root = makeTree({
    "medium.ts": fn.repeat(Math.ceil((300 * 1024) / fn.length)),
    "huge.ts": fn.repeat(Math.ceil((1100 * 1024) / fn.length)),
  });
  const result = await scan({ root, ...baseOptions });
  const byPath = Object.fromEntries(result.files.map((f) => [f.path, f]));
  expect(byPath["medium.ts"]!.complexity).toBeGreaterThan(0);
  expect(byPath["medium.ts"]!.symbolsSkipped).toBeUndefined();
  expect(byPath["huge.ts"]!.symbolsSkipped).toBe(true);
});
