import { LANG_BY_ID } from "../languages.js";
import type { SymbolCounts } from "../types.js";
import { emptySymbols } from "../types.js";
import { parseSymbols as treeSitterParse } from "./treeSitter.js";
import { regexParse } from "./regex.js";

export interface ParseResult {
  symbols: SymbolCounts;
  complexity: number;
  parseError?: string;
}

export async function parseFile(languageId: string, source: string): Promise<ParseResult> {
  const lang = LANG_BY_ID.get(languageId);
  if (!lang) return { symbols: emptySymbols(), complexity: 0 };

  switch (lang.parser) {
    case "tree-sitter":
      return treeSitterParse(languageId, source);
    case "vue-sfc":
      return parseVueScripts(source);
    case "regex":
      if (lang.regexParser) return regexParse(lang.regexParser, source);
      return { symbols: emptySymbols(), complexity: 0 };
    case "lines-only":
    default:
      return { symbols: emptySymbols(), complexity: 0 };
  }
}

const VUE_SCRIPT_RE = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
const VUE_TS_LANG_RE = /\blang\s*=\s*["'](ts|tsx)["']/i;

async function parseVueScripts(source: string): Promise<ParseResult> {
  const symbols = emptySymbols();
  let complexity = 0;
  for (const [, attributes = "", body = ""] of source.matchAll(VUE_SCRIPT_RE)) {
    const lang = VUE_TS_LANG_RE.exec(attributes)?.[1];
    const parsed = await treeSitterParse(lang === "tsx" ? "tsx" : lang === "ts" ? "typescript" : "javascript", body);
    if (parsed.parseError) return { symbols: emptySymbols(), complexity: 0, parseError: parsed.parseError };
    symbols.functions += parsed.symbols.functions;
    symbols.classes += parsed.symbols.classes;
    symbols.variables += parsed.symbols.variables;
    symbols.branches += parsed.symbols.branches;
    complexity += parsed.complexity;
  }
  return { symbols, complexity };
}
