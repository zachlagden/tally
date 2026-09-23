import React from "react";
import { render } from "ink";
import type { ScanOptions, ScanResult } from "../types.js";
import { StaticSummary } from "./StaticSummary.js";
import { App } from "./App.js";

export async function renderStatic(result: ScanResult, showSymbols: boolean): Promise<void> {
  const { waitUntilExit } = render(<StaticSummary result={result} showSymbols={showSymbols} />, { exitOnCtrlC: true });
  await waitUntilExit();
}

export async function renderApp(
  initialPath: string | undefined,
  scanOptions: Omit<ScanOptions, "root" | "onProgress">,
): Promise<void> {
  const { waitUntilExit } = render(
    <App {...(initialPath ? { initialPath } : {})} scanOptions={scanOptions} />,
    { exitOnCtrlC: true }
  );
  await waitUntilExit();
}
