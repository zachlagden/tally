import { LANG_BY_ID } from "../languages.js";
import type { SymbolCounts } from "../types.js";
import { emptySymbols } from "../types.js";
import { parseSymbols as treeSitterParse } from "./treeSitter.js";

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
    case "regex":
      // TODO(phase 10): wire regex fallback parsers
      return { symbols: emptySymbols(), complexity: 0 };
    case "lines-only":
    default:
      return { symbols: emptySymbols(), complexity: 0 };
  }
}
