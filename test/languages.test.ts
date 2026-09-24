import { beforeAll, describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { scan } from "../src/scan/index.js";
import { LANGUAGES } from "../src/languages.js";
import type { FileStat } from "../src/types.js";

interface Expectation {
  language: string;
  file: string;
  lines: number;
  comment: number;
  blank: number;
  code: number;
  functions: number;
  classes: number;
  variables: number;
  complexity: number;
}

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const EXPECTED = JSON.parse(readFileSync(join(FIXTURES, "languages.expected.json"), "utf8")) as Expectation[];

const KNOWN_ISSUES: Record<string, string> = {};

let byLanguage: Map<string, FileStat>;

beforeAll(async () => {
  const result = await scan({ root: join(FIXTURES, "languages"), topN: 10, includeSymbols: true, includeGit: false });
  byLanguage = new Map(result.files.map((f) => [f.language, f]));
});

test("every supported language has a fixture", () => {
  expect(EXPECTED.map((e) => e.language).sort()).toEqual(LANGUAGES.map((l) => l.id).sort());
});

describe.each(EXPECTED)("$language ($file)", (expected) => {
  test("classifies the file and counts lines", () => {
    const stat = byLanguage.get(expected.language);
    expect(stat?.path).toBe(expected.file);
    expect({
      lines: stat?.lines,
      comment: stat?.commentLines,
      blank: stat?.blankLines,
      code: stat?.codeLines,
    }).toEqual({ lines: expected.lines, comment: expected.comment, blank: expected.blank, code: expected.code });
  });

  const symbolTest = KNOWN_ISSUES[expected.language] ? test.fails : test;
  symbolTest(`counts symbols${KNOWN_ISSUES[expected.language] ? ` (known issue: ${KNOWN_ISSUES[expected.language]})` : ""}`, () => {
    const stat = byLanguage.get(expected.language)!;
    expect({
      functions: stat.symbols.functions,
      classes: stat.symbols.classes,
      variables: stat.symbols.variables,
      complexity: stat.complexity,
    }).toEqual({
      functions: expected.functions,
      classes: expected.classes,
      variables: expected.variables,
      complexity: expected.complexity,
    });
  });
});
