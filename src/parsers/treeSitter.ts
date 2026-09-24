import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pLimit, { type LimitFunction } from "p-limit";
import { Language, Parser, Query, type Tree } from "web-tree-sitter";
import type { SymbolCounts } from "../types.js";
import { emptySymbols } from "../types.js";
import { LANG_BY_ID } from "../languages.js";
import { getQueryFor } from "./queries.js";

let initPromise: Promise<void> | null = null;
let grammarDir: string | undefined;
const languageCache = new Map<string, Promise<Language>>();
const parserCache = new Map<string, Parser>();
const queryCache = new Map<string, Query | null>();
const grammarQueues = new Map<string, LimitFunction>();

function findGrammarDir(): string {
  if (grammarDir) return grammarDir;
  let dir = dirname(fileURLToPath(import.meta.url));
  while (!existsSync(join(dir, "grammars", "manifest.json"))) {
    const parent = dirname(dir);
    if (parent === dir) throw new Error("tally: grammars folder not found next to the installed package");
    dir = parent;
  }
  grammarDir = join(dir, "grammars");
  return grammarDir;
}

export function grammarPath(grammar: string): string {
  return join(findGrammarDir(), `tree-sitter-${grammar}.wasm`);
}

async function ensureInit(): Promise<void> {
  initPromise ??= Parser.init();
  return initPromise;
}

export async function loadLanguage(grammar: string): Promise<Language> {
  let pending = languageCache.get(grammar);
  if (!pending) {
    pending = (async () => {
      await ensureInit();
      return Language.load(await readFile(grammarPath(grammar)));
    })();
    languageCache.set(grammar, pending);
  }
  return pending;
}

function getOrCompileQuery(lang: Language, languageId: string): Query | null {
  const cached = queryCache.get(languageId);
  if (cached !== undefined) return cached;
  const source = getQueryFor(languageId);
  if (!source) {
    queryCache.set(languageId, null);
    return null;
  }
  const query = new Query(lang, source);
  queryCache.set(languageId, query);
  return query;
}

function queueFor(grammar: string): LimitFunction {
  let queue = grammarQueues.get(grammar);
  if (!queue) {
    queue = pLimit(1);
    grammarQueues.set(grammar, queue);
  }
  return queue;
}

export async function parseSymbols(languageId: string, source: string): Promise<{
  symbols: SymbolCounts;
  complexity: number;
  parseError?: string;
}> {
  const lang = LANG_BY_ID.get(languageId);
  if (!lang || lang.parser !== "tree-sitter" || !lang.treeSitterGrammar || !getQueryFor(languageId)) {
    return { symbols: emptySymbols(), complexity: 0 };
  }
  const grammar = lang.treeSitterGrammar;

  return queueFor(grammar)(async () => {
    let tree: Tree | null = null;
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
      if (!tree) throw new Error("tree-sitter returned no tree");
      const symbols = emptySymbols();
      for (const capture of query.captures(tree.rootNode)) {
        switch (capture.name) {
          case "function": symbols.functions++; break;
          case "class": symbols.classes++; break;
          case "variable": symbols.variables++; break;
          case "branch": symbols.branches++; break;
        }
      }
      return { symbols, complexity: symbols.functions + symbols.branches };
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
