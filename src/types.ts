export interface SymbolCounts {
  functions: number;
  classes: number;
  variables: number;
  branches: number;
}

export interface FileStat {
  path: string;
  absPath: string;
  language: string;
  bytes: number;
  chars: number;
  lines: number;
  codeLines: number;
  blankLines: number;
  commentLines: number;
  symbols: SymbolCounts;
  complexity: number;
  symbolsSkipped?: boolean;
  parseError?: string;
}

export interface SkippedFile {
  path: string;
  reason: string;
}

export interface LanguageStat {
  id: string;
  name: string;
  color: string;
  files: number;
  bytes: number;
  chars: number;
  lines: number;
  codeLines: number;
  blankLines: number;
  commentLines: number;
  symbols: SymbolCounts;
  complexity: number;
}

export interface GitInsights {
  contributors: number;
  topContributor: { name: string; commits: number; percentage: number };
  firstCommitDate: string;
  commitCount: number;
  ageDays: number;
}

export interface ScanResult {
  root: string;
  scanDurationMs: number;
  fileCount: number;
  totalLines: number;
  totalBytes: number;
  totalChars: number;
  languages: LanguageStat[];
  files: FileStat[];
  largestFiles: FileStat[];
  mostComplexFiles: FileStat[];
  skippedFiles: SkippedFile[];
  git?: GitInsights;
}

export interface ScanOptions {
  root: string;
  topN: number;
  includeSymbols: boolean;
  includeGit: boolean;
  languages?: string[];
  onProgress?: (current: number, total: number, currentFile?: string) => void;
}

export function emptySymbols(): SymbolCounts {
  return { functions: 0, classes: 0, variables: 0, branches: 0 };
}
