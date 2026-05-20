import type { ScanResult } from "../types.js";

export function toJson(result: ScanResult, pretty = true): string {
  const payload = {
    root: result.root,
    scanDurationMs: Math.round(result.scanDurationMs),
    fileCount: result.fileCount,
    totalLines: result.totalLines,
    totalBytes: result.totalBytes,
    totalChars: result.totalChars,
    languages: result.languages.map((l) => ({
      id: l.id,
      name: l.name,
      files: l.files,
      bytes: l.bytes,
      chars: l.chars,
      lines: l.lines,
      codeLines: l.codeLines,
      blankLines: l.blankLines,
      commentLines: l.commentLines,
      functions: l.symbols.functions,
      classes: l.symbols.classes,
      variables: l.symbols.variables,
      complexity: l.complexity,
    })),
    largestFiles: result.largestFiles.map(serializeFile),
    mostComplexFiles: result.mostComplexFiles.map(serializeFile),
    git: result.git,
  };
  return pretty ? JSON.stringify(payload, null, 2) : JSON.stringify(payload);
}

function serializeFile(f: ScanResult["files"][number]) {
  return {
    path: f.path,
    language: f.language,
    bytes: f.bytes,
    chars: f.chars,
    lines: f.lines,
    codeLines: f.codeLines,
    blankLines: f.blankLines,
    commentLines: f.commentLines,
    functions: f.symbols.functions,
    classes: f.symbols.classes,
    variables: f.symbols.variables,
    complexity: f.complexity,
  };
}
