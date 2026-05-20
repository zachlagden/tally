import { test, expect } from "vitest";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { scan } from "../src/scan/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(__dirname, "fixtures", "sample");

test("scan walks the fixture, classifies by extension, counts lines", async () => {
  const result = await scan({
    root: FIXTURE,
    topN: 5,
    includeSymbols: true,
    includeGit: false,
  });

  expect(result.fileCount).toBe(3);
  const byId = Object.fromEntries(result.languages.map((l) => [l.id, l]));
  expect(byId.typescript).toBeDefined();
  expect(byId.python).toBeDefined();
  expect(byId.json).toBeDefined();
  expect(byId.typescript!.files).toBe(1);
  expect(byId.python!.files).toBe(1);
  expect(byId.json!.files).toBe(1);
});

test("scan extracts symbol counts via tree-sitter", async () => {
  const result = await scan({
    root: FIXTURE,
    topN: 5,
    includeSymbols: true,
    includeGit: false,
  });
  const ts = result.languages.find((l) => l.id === "typescript")!;
  const py = result.languages.find((l) => l.id === "python")!;

  expect(ts.symbols.functions).toBeGreaterThanOrEqual(4); // add, multiply, Calculator.add, Calculator.reset
  expect(ts.symbols.classes).toBe(1);
  expect(ts.symbols.variables).toBeGreaterThanOrEqual(3); // greeting, count, mutable
  expect(ts.complexity).toBeGreaterThan(ts.symbols.functions); // base + branches

  expect(py.symbols.functions).toBeGreaterThanOrEqual(3); // greet, __init__, say
  expect(py.symbols.classes).toBe(1);
});

test("scan with --no-symbols skips tree-sitter", async () => {
  const result = await scan({
    root: FIXTURE,
    topN: 5,
    includeSymbols: false,
    includeGit: false,
  });
  for (const lang of result.languages) {
    expect(lang.symbols.functions).toBe(0);
    expect(lang.symbols.classes).toBe(0);
  }
});

test("scan produces largest and most-complex file lists", async () => {
  const result = await scan({
    root: FIXTURE,
    topN: 5,
    includeSymbols: true,
    includeGit: false,
  });
  expect(result.largestFiles.length).toBeGreaterThan(0);
  expect(result.mostComplexFiles.length).toBeGreaterThan(0);
});
