import { setFlagsFromString } from "node:v8";

export type WasmTier = "liftoff" | "turbofan";

export const LIFTOFF_MAX_TASKS = 1000;

let chosen: WasmTier | undefined;

export function chooseWasmTier(taskCount: number): WasmTier {
  if (chosen) return chosen;
  const override = process.env.TALLY_WASM_TIER;
  chosen = override === "liftoff" || override === "turbofan"
    ? override
    : taskCount <= LIFTOFF_MAX_TASKS ? "liftoff" : "turbofan";
  if (chosen === "liftoff") setFlagsFromString("--liftoff-only");
  return chosen;
}
