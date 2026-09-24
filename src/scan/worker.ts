import { parentPort, workerData } from "node:worker_threads";
import { processFile, type FileTask, type ProcessConfig } from "./processFile.js";
import type { WorkerMessage } from "./pool.js";

const config = workerData as ProcessConfig;
const port = parentPort;

if (!port) throw new Error("tally worker must be started as a worker thread");

const send = (message: WorkerMessage): void => port.postMessage(message);

port.on("message", async (batch: FileTask[]) => {
  for (let index = 0; index < batch.length; index++) {
    send({ kind: "start", index });
    const outcome = await processFile(batch[index]!, config);
    send({ kind: "outcome", outcome });
    if (outcome.kind === "stat" && outcome.stat.parseError) {
      send({ kind: "retire", index });
      return;
    }
  }
  send({ kind: "done" });
});
