import { join } from "node:path";
import pLimit from "p-limit";
import { cpus } from "node:os";
import type { FileStat, ScanOptions, ScanResult } from "../types.js";
import { emptySymbols } from "../types.js";
import { walk } from "./walk.js";
import { classifyByPath } from "./classify.js";
import { readAndCount } from "./readFile.js";
import { buildResult } from "./aggregate.js";
import { parseFile } from "../parsers/index.js";

const MAX_SYMBOL_FILE_BYTES = 200 * 1024;

export async function scan(options: ScanOptions): Promise<ScanResult> {
  const started = performance.now();
  const { files: relPaths, root } = await walk(options.root);
  const langFilter = options.languages?.length ? new Set(options.languages) : undefined;
  const concurrency = Math.max(4, cpus().length * 2);
  const limit = pLimit(concurrency);
  const fileStats: FileStat[] = [];
  let processed = 0;
  const total = relPaths.length;

  await Promise.all(
    relPaths.map((rel) =>
      limit(async () => {
        try {
          const langId = classifyByPath(rel);
          if (!langId) {
            processed++;
            options.onProgress?.(processed, total, rel);
            return;
          }
          if (langFilter && !langFilter.has(langId)) {
            processed++;
            options.onProgress?.(processed, total, rel);
            return;
          }
          const absPath = join(root, rel);
          const { metrics, source } = await readAndCount(absPath, langId);
          let symbols = emptySymbols();
          let complexity = 0;
          let parseError: string | undefined;
          if (options.includeSymbols && metrics.bytes <= MAX_SYMBOL_FILE_BYTES) {
            const parsed = await parseFile(langId, source);
            symbols = parsed.symbols;
            complexity = parsed.complexity;
            parseError = parsed.parseError;
          }
          fileStats.push({
            path: rel,
            absPath,
            language: langId,
            bytes: metrics.bytes,
            chars: metrics.chars,
            lines: metrics.lines,
            codeLines: metrics.codeLines,
            blankLines: metrics.blankLines,
            commentLines: metrics.commentLines,
            symbols,
            complexity,
            ...(parseError ? { parseError } : {}),
          });
        } catch {
          // unreadable file — silently skip
        } finally {
          processed++;
          options.onProgress?.(processed, total, rel);
        }
      })
    )
  );

  const durationMs = performance.now() - started;
  return buildResult(root, fileStats, durationMs, options.topN);
}
