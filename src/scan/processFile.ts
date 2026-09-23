import { open, readFile } from "node:fs/promises";
import type { FileStat } from "../types.js";
import { emptySymbols } from "../types.js";
import { classifyByContent, isBinary } from "./classify.js";
import { countLines } from "./countLines.js";
import { parseFile } from "../parsers/index.js";

const MAX_SYMBOL_FILE_BYTES = 1024 * 1024;
const SHEBANG_PROBE_BYTES = 256;
const IGNORABLE_ERROR_CODES = new Set(["ENOENT", "EISDIR", "ELOOP"]);

export interface FileTask {
  rel: string;
  absPath: string;
  language?: string;
}

export interface ProcessConfig {
  includeSymbols: boolean;
  languages?: string[];
}

export type FileOutcome =
  | { kind: "stat"; stat: FileStat }
  | { kind: "ignored" }
  | { kind: "skipped"; path: string; reason: string };

const IGNORED: FileOutcome = { kind: "ignored" };

export async function processFile(task: FileTask, config: ProcessConfig): Promise<FileOutcome> {
  try {
    const language = task.language ?? (await detectShebangLanguage(task.absPath));
    if (!language) return IGNORED;
    if (config.languages && !config.languages.includes(language)) return IGNORED;

    const buf = await readFile(task.absPath);
    if (isBinary(buf)) return IGNORED;

    const source = buf.toString("utf8");
    const metrics = countLines(source, language);
    const stat: FileStat = {
      path: task.rel,
      absPath: task.absPath,
      language,
      bytes: buf.byteLength,
      chars: source.length,
      ...metrics,
      symbols: emptySymbols(),
      complexity: 0,
    };

    if (config.includeSymbols) {
      if (buf.byteLength > MAX_SYMBOL_FILE_BYTES) {
        stat.symbolsSkipped = true;
      } else {
        const parsed = await parseFile(language, source);
        stat.symbols = parsed.symbols;
        stat.complexity = parsed.complexity;
        if (parsed.parseError) stat.parseError = parsed.parseError;
      }
    }

    return { kind: "stat", stat };
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code && IGNORABLE_ERROR_CODES.has(code)) return IGNORED;
    return { kind: "skipped", path: task.rel, reason: err instanceof Error ? err.message : String(err) };
  }
}

async function detectShebangLanguage(absPath: string): Promise<string | undefined> {
  const handle = await open(absPath, "r");
  try {
    const probe = Buffer.alloc(SHEBANG_PROBE_BYTES);
    const { bytesRead } = await handle.read(probe, 0, SHEBANG_PROBE_BYTES, 0);
    return classifyByContent(probe.subarray(0, bytesRead));
  } finally {
    await handle.close();
  }
}
