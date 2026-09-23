import { basename, extname, join } from "node:path";
import { availableParallelism } from "node:os";
import type { FileStat, ScanOptions, ScanResult, SkippedFile } from "../types.js";
import { walk } from "./walk.js";
import { classifyByPath } from "./classify.js";
import { buildResult } from "./aggregate.js";
import { processFile, type FileOutcome, type FileTask, type ProcessConfig } from "./processFile.js";
import { resolveWorkerPath, runInWorkers } from "./pool.js";
import { gatherGitInsights } from "../git/insights.js";

const IN_PROCESS_CONCURRENCY = 16;
const MIN_TASKS_PER_WORKER = 150;

export async function scan(options: ScanOptions): Promise<ScanResult> {
  const started = performance.now();
  const { files: relPaths, root, inGitRepo } = await walk(options.root);
  const langFilter = options.languages?.length ? new Set(options.languages) : undefined;

  const tasks = buildTasks(root, relPaths, langFilter);
  const config: ProcessConfig = {
    includeSymbols: options.includeSymbols,
    ...(langFilter ? { languages: [...langFilter] } : {}),
  };

  const fileStats: FileStat[] = [];
  const skippedFiles: SkippedFile[] = [];
  const total = tasks.length;
  let processed = 0;

  const record = (outcome: FileOutcome, rel?: string): void => {
    if (outcome.kind === "stat") fileStats.push(outcome.stat);
    else if (outcome.kind === "skipped") skippedFiles.push({ path: outcome.path, reason: outcome.reason });
    processed++;
    options.onProgress?.(processed, total, rel ?? (outcome.kind === "stat" ? outcome.stat.path : undefined));
  };

  const gitPromise = options.includeGit && inGitRepo ? gatherGitInsights(root) : Promise.resolve(undefined);

  const workerCount = chooseWorkerCount(options.threads, total, options.includeSymbols);
  const workerPath = workerCount > 0 ? resolveWorkerPath() : undefined;
  if (workerPath) {
    await runInWorkers(workerPath, tasks, config, workerCount, (outcome) => record(outcome));
  } else {
    await runInProcess(tasks, config, record);
  }

  const git = await gitPromise;
  fileStats.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  skippedFiles.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  const result = buildResult(root, fileStats, skippedFiles, performance.now() - started, options.topN);
  if (git) result.git = git;
  return result;
}

function buildTasks(root: string, relPaths: string[], langFilter: Set<string> | undefined): FileTask[] {
  const tasks: FileTask[] = [];
  for (const rel of relPaths) {
    const language = classifyByPath(rel);
    const absPath = join(root, rel);
    if (language) {
      if (!langFilter || langFilter.has(language)) tasks.push({ rel, absPath, language });
    } else if (extname(basename(rel)) === "") {
      tasks.push({ rel, absPath });
    }
  }
  return tasks.sort((a, b) => (a.language ?? "").localeCompare(b.language ?? ""));
}

function chooseWorkerCount(requested: number | undefined, taskCount: number, includeSymbols: boolean): number {
  if (requested !== undefined) return requested;
  const perWorker = includeSymbols ? MIN_TASKS_PER_WORKER : MIN_TASKS_PER_WORKER * 10;
  const byWork = Math.floor(taskCount / perWorker);
  if (byWork < 2) return 0;
  return Math.min(byWork, Math.max(1, availableParallelism() - 1));
}

async function runInProcess(
  tasks: FileTask[],
  config: ProcessConfig,
  record: (outcome: FileOutcome, rel?: string) => void,
): Promise<void> {
  let next = 0;
  const lane = async (): Promise<void> => {
    while (next < tasks.length) {
      const task = tasks[next++]!;
      record(await processFile(task, config), task.rel);
    }
  };
  await Promise.all(Array.from({ length: IN_PROCESS_CONCURRENCY }, lane));
}
