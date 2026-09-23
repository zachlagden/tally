import type { FileStat, LanguageStat, ScanResult, SkippedFile, SymbolCounts } from "../types.js";
import { emptySymbols } from "../types.js";
import { LANG_BY_ID } from "../languages.js";

export function aggregateLanguages(files: FileStat[]): LanguageStat[] {
  const byLang = new Map<string, LanguageStat>();

  for (const f of files) {
    let agg = byLang.get(f.language);
    if (!agg) {
      const meta = LANG_BY_ID.get(f.language);
      agg = {
        id: f.language,
        name: meta?.name ?? f.language,
        color: meta?.color ?? "#888888",
        files: 0,
        bytes: 0,
        chars: 0,
        lines: 0,
        codeLines: 0,
        blankLines: 0,
        commentLines: 0,
        symbols: emptySymbols(),
        complexity: 0,
      };
      byLang.set(f.language, agg);
    }
    agg.files += 1;
    agg.bytes += f.bytes;
    agg.chars += f.chars;
    agg.lines += f.lines;
    agg.codeLines += f.codeLines;
    agg.blankLines += f.blankLines;
    agg.commentLines += f.commentLines;
    addSymbols(agg.symbols, f.symbols);
    agg.complexity += f.complexity;
  }

  return [...byLang.values()].sort((a, b) => b.codeLines - a.codeLines);
}

function addSymbols(into: SymbolCounts, from: SymbolCounts): void {
  into.functions += from.functions;
  into.classes += from.classes;
  into.variables += from.variables;
  into.branches += from.branches;
}

export function buildResult(
  root: string,
  files: FileStat[],
  skippedFiles: SkippedFile[],
  scanDurationMs: number,
  topN: number,
): ScanResult {
  const languages = aggregateLanguages(files);
  const largest = [...files].sort((a, b) => b.codeLines - a.codeLines).slice(0, topN);
  const complex = [...files].sort((a, b) => b.complexity - a.complexity).slice(0, topN);
  return {
    root,
    scanDurationMs,
    fileCount: files.length,
    totalLines: files.reduce((s, f) => s + f.lines, 0),
    totalBytes: files.reduce((s, f) => s + f.bytes, 0),
    totalChars: files.reduce((s, f) => s + f.chars, 0),
    languages,
    files,
    largestFiles: largest,
    mostComplexFiles: complex,
    skippedFiles,
  };
}
