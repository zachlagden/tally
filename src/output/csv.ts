import type { ScanResult } from "../types.js";

const HEADER = [
  "language",
  "files",
  "code_lines",
  "comment_lines",
  "blank_lines",
  "total_lines",
  "chars",
  "bytes",
  "functions",
  "classes",
  "variables",
  "complexity",
];

export function toCsv(result: ScanResult): string {
  const rows: string[] = [HEADER.join(",")];
  for (const l of result.languages) {
    rows.push([
      escape(l.name),
      l.files,
      l.codeLines,
      l.commentLines,
      l.blankLines,
      l.lines,
      l.chars,
      l.bytes,
      l.symbols.functions,
      l.symbols.classes,
      l.symbols.variables,
      l.complexity,
    ].join(","));
  }
  return rows.join("\n");
}

function escape(s: string): string {
  if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
