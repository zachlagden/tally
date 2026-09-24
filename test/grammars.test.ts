import { describe, expect, test } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Query } from "web-tree-sitter";
import { LANGUAGES } from "../src/languages.js";
import { getQueryFor } from "../src/parsers/queries.js";
import { grammarPath, loadLanguage } from "../src/parsers/treeSitter.js";

const GRAMMARS = join(dirname(fileURLToPath(import.meta.url)), "..", "grammars");
const manifest = JSON.parse(readFileSync(join(GRAMMARS, "manifest.json"), "utf8")) as {
  grammars: Array<{ grammar: string; package: string; version: string }>;
};
const treeSitterLanguages = LANGUAGES.filter((l) => l.parser === "tree-sitter");

test("the manifest lists exactly the grammars the languages use", () => {
  const used = [...new Set(treeSitterLanguages.map((l) => l.treeSitterGrammar!))].sort();
  expect(manifest.grammars.map((g) => g.grammar).sort()).toEqual(used);
});

test("the licence file covers every grammar package", () => {
  const licenses = readFileSync(join(GRAMMARS, "LICENSES.md"), "utf8");
  for (const g of manifest.grammars) expect(licenses, g.package).toContain(`## ${g.package}@${g.version}`);
});

describe.each(treeSitterLanguages)("$id", (lang) => {
  test("its grammar is vendored, loads, and its query compiles", async () => {
    expect(existsSync(grammarPath(lang.treeSitterGrammar!))).toBe(true);
    const language = await loadLanguage(lang.treeSitterGrammar!);
    const source = getQueryFor(lang.id);
    expect(source, "query").toBeDefined();
    expect(() => new Query(language, source!)).not.toThrow();
  });
});
