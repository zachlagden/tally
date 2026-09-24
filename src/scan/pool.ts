import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Worker } from "node:worker_threads";
import type { FileOutcome, FileTask, ProcessConfig } from "./processFile.js";

const BATCH_SIZE = 32;

export type WorkerMessage =
  | { kind: "start"; index: number }
  | { kind: "outcome"; outcome: FileOutcome }
  | { kind: "retire"; index: number }
  | { kind: "done" };

type BatchResult = { kind: "done" } | { kind: "timeout"; index: number } | { kind: "retired"; index: number };

export interface PoolCallbacks {
  onOutcome: (outcome: FileOutcome) => void;
  onTimeout: (task: FileTask) => Promise<void>;
}

export function resolveWorkerPath(): string | undefined {
  const path = fileURLToPath(new URL("./worker.js", import.meta.url));
  return existsSync(path) ? path : undefined;
}

export async function runInWorkers(
  workerPath: string,
  tasks: FileTask[],
  config: ProcessConfig,
  workerCount: number,
  fileTimeoutMs: number,
  callbacks: PoolCallbacks,
): Promise<void> {
  const queue: FileTask[][] = [];
  for (let i = 0; i < tasks.length; i++) {
    if (i % BATCH_SIZE === 0) queue.push([]);
    queue[queue.length - 1]!.push(tasks[i]!);
  }

  const spawn = (): Worker => new Worker(workerPath, { workerData: config });

  const runSlot = async (): Promise<void> => {
    let worker = spawn();
    try {
      for (let batch = queue.shift(); batch; batch = queue.shift()) {
        const result = await runBatch(worker, batch, fileTimeoutMs, callbacks.onOutcome);
        if (result.kind === "done") continue;
        await worker.terminate();
        if (result.kind === "timeout") await callbacks.onTimeout(batch[result.index]!);
        const rest = batch.slice(result.index + 1);
        if (rest.length > 0) queue.unshift(rest);
        worker = spawn();
      }
    } finally {
      await worker.terminate();
    }
  };

  await Promise.all(Array.from({ length: Math.min(workerCount, queue.length) }, runSlot));
}

function runBatch(
  worker: Worker,
  batch: FileTask[],
  fileTimeoutMs: number,
  onOutcome: (outcome: FileOutcome) => void,
): Promise<BatchResult> {
  return new Promise((resolve, reject) => {
    let timer: NodeJS.Timeout | undefined;

    const cleanup = (): void => {
      clearTimeout(timer);
      worker.off("message", onMessage);
      worker.off("error", onError);
      worker.off("exit", onExit);
    };
    const onMessage = (message: WorkerMessage): void => {
      if (message.kind === "start") {
        clearTimeout(timer);
        timer = setTimeout(() => {
          cleanup();
          resolve({ kind: "timeout", index: message.index });
        }, fileTimeoutMs);
      } else if (message.kind === "outcome") {
        clearTimeout(timer);
        onOutcome(message.outcome);
      } else if (message.kind === "retire") {
        cleanup();
        resolve({ kind: "retired", index: message.index });
      } else {
        cleanup();
        resolve({ kind: "done" });
      }
    };
    const onError = (err: Error): void => {
      cleanup();
      reject(err);
    };
    const onExit = (code: number): void => {
      cleanup();
      reject(new Error(`tally worker exited with code ${code}`));
    };

    worker.on("message", onMessage);
    worker.on("error", onError);
    worker.on("exit", onExit);
    worker.postMessage(batch);
  });
}
