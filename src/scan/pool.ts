import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Worker } from "node:worker_threads";
import type { FileOutcome, FileTask, ProcessConfig } from "./processFile.js";

const BATCH_SIZE = 32;

export function resolveWorkerPath(): string | undefined {
  const path = fileURLToPath(new URL("./worker.js", import.meta.url));
  return existsSync(path) ? path : undefined;
}

export async function runInWorkers(
  workerPath: string,
  tasks: FileTask[],
  config: ProcessConfig,
  workerCount: number,
  onOutcome: (outcome: FileOutcome) => void,
): Promise<void> {
  const batches: FileTask[][] = [];
  for (let i = 0; i < tasks.length; i += BATCH_SIZE) batches.push(tasks.slice(i, i + BATCH_SIZE));

  let nextBatch = 0;
  const workers: Worker[] = [];

  try {
    await Promise.all(
      Array.from({ length: Math.min(workerCount, batches.length) }, () =>
        new Promise<void>((resolve, reject) => {
          const worker = new Worker(workerPath, { workerData: config });
          workers.push(worker);
          const dispatch = (): void => {
            const batch = batches[nextBatch++];
            if (batch) {
              worker.postMessage(batch);
            } else {
              resolve();
            }
          };
          worker.on("message", (outcomes: FileOutcome[]) => {
            for (const outcome of outcomes) onOutcome(outcome);
            dispatch();
          });
          worker.on("error", reject);
          worker.on("exit", (code) => {
            if (code !== 0) reject(new Error(`tally worker exited with code ${code}`));
          });
          dispatch();
        })
      )
    );
  } finally {
    await Promise.all(workers.map((worker) => worker.terminate()));
  }
}
