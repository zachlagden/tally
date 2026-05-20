import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import pLimit, { type LimitFunction } from "p-limit";
import Parser from "web-tree-sitter";
import type { SymbolCounts } from "../types.js";
import { emptySymbols } from "../types.js";
import { LANG_BY_ID } from "../languages.js";
import { getQueryFor } from "./queries.js";

const require = createRequire(import.meta.url);

const PROBLEMATIC_GRAMMARS = new Set(["yaml", "json", "toml", "html", "css"]);

let initPromise: Promise<void> | null = null;
const languageCache = new Map<string, Promise<Parser.Language>>();
const parserCache = new Map<string, Parser>();
const queryCache = new Map<string, Parser.Query | null>();
const grammarQueues = new Map<string, LimitFunction>();

function resolveRuntimeWasm(): string {
  const pkgPath = require.resolve("web-tree-sitter/package.json");
  return join(dirname(pkgPath), "tree-sitter.wasm");
}

function resolveGrammarWasm(grammar: string): string {
  const pkgPath = require.resolve("tree-sitter-wasms/package.json");
  return join(dirname(pkgPath), "out", `tree-sitter-${grammar}.wasm`);
}

async function ensureInit(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = Parser.init({
    locateFile(filename: string) {
      if (filename === "tree-sitter.wasm") return resolveRuntimeWasm();
      return filename;
    },
  });
  return initPromise;
}

async function loadLanguage(grammar: string): Promise<Parser.Language> {
  let p = languageCache.get(grammar);
  if (p) return p;
  p = (async () => {
    await ensureInit();
    const wasmBytes = await readFile(resolveGrammarWasm(grammar));
    return Parser.Language.load(wasmBytes);
  })();
  languageCache.set(grammar, p);
  return p;
}

function getOrCompileQuery(lang: Parser.Language, languageId: string): Parser.Query | null {
  const cached = queryCache.get(languageId);
  if (cached !== undefined) return cached;
  const queryStr = getQueryFor(languageId);
  if (!queryStr) {
    queryCache.set(languageId, null);
    return null;
  }
  try {
    const q = lang.query(queryStr);
    queryCache.set(languageId, q);
    return q;
  } catch (err) {
    if (process.env.TALLY_DEBUG) {
      console.error(`[tally] query compile error for ${languageId}:`, err);
    }
    queryCache.set(languageId, null);
    return null;
  }
}

function queueFor(grammar: string): LimitFunction {
  let q = grammarQueues.get(grammar);
  if (!q) {
    q = pLimit(1);
    grammarQueues.set(grammar, q);
  }
  return q;
}

export async function parseSymbols(languageId: string, source: string): Promise<{
  symbols: SymbolCounts;
  complexity: number;
  parseError?: string;
}> {
  const lang = LANG_BY_ID.get(languageId);
  if (!lang || lang.parser !== "tree-sitter" || !lang.treeSitterGrammar) {
    return { symbols: emptySymbols(), complexity: 0 };
  }
  const grammar = lang.treeSitterGrammar;
  if (PROBLEMATIC_GRAMMARS.has(grammar)) {
    return { symbols: emptySymbols(), complexity: 0 };
  }
  if (!getQueryFor(languageId)) {
    return { symbols: emptySymbols(), complexity: 0 };
  }

  return queueFor(grammar)(async () => {
    let tree: Parser.Tree | undefined;
    try {
      const language = await loadLanguage(grammar);
      const query = getOrCompileQuery(language, languageId);
      if (!query) return { symbols: emptySymbols(), complexity: 0 };

      let parser = parserCache.get(grammar);
      if (!parser) {
        parser = new Parser();
        parser.setLanguage(language);
        parserCache.set(grammar, parser);
      }

      tree = parser.parse(source);
      const captures = query.captures(tree.rootNode);
      const symbols = emptySymbols();
      for (const cap of captures) {
        switch (cap.name) {
          case "function": symbols.functions++; break;
          case "class": symbols.classes++; break;
          case "variable": symbols.variables++; break;
          case "branch": symbols.branches++; break;
        }
      }
      const complexity = symbols.functions + symbols.branches;
      return { symbols, complexity };
    } catch (err) {
      if (process.env.TALLY_DEBUG) {
        console.error(`[tally] parse error for ${languageId}:`, err);
      }
      return {
        symbols: emptySymbols(),
        complexity: 0,
        parseError: err instanceof Error ? err.message : String(err),
      };
    } finally {
      tree?.delete();
    }
  });
}
