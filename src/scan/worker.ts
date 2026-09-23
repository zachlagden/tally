import { parentPort, workerData } from "node:worker_threads";
import { processFile, type FileOutcome, type FileTask, type ProcessConfig } from "./processFile.js";

const config = workerData as ProcessConfig;
const port = parentPort;

if (!port) throw new Error("tally worker must be started as a worker thread");

port.on("message", async (batch: FileTask[]) => {
  const outcomes: FileOutcome[] = [];
  for (const task of batch) outcomes.push(await processFile(task, config));
  port.postMessage(outcomes);
});
