import React, { useEffect, useRef, useState } from "react";
import { Box, Text, useApp } from "ink";
import type { ScanResult, ScanOptions } from "../types.js";
import { scan } from "../scan/index.js";
import { FolderPicker } from "./FolderPicker.js";
import { ScanProgress } from "./ScanProgress.js";
import { InteractiveResults } from "./InteractiveResults.js";

type Mode =
  | { kind: "picker" }
  | { kind: "scanning"; root: string; current: number; total: number; currentFile?: string }
  | { kind: "results"; result: ScanResult }
  | { kind: "error"; message: string };

interface Props {
  initialPath?: string;
  scanOptions: Omit<ScanOptions, "root" | "onProgress">;
}

export function App({ initialPath, scanOptions }: Props) {
  const { exit } = useApp();
  const [mode, setMode] = useState<Mode>(
    initialPath ? { kind: "scanning", root: initialPath, current: 0, total: 0 } : { kind: "picker" }
  );
  const scanStarted = useRef(false);

  useEffect(() => {
    if (mode.kind !== "scanning" || scanStarted.current) return;
    scanStarted.current = true;
    const root = mode.root;
    let lastUpdate = 0;
    scan({
      ...scanOptions,
      root,
      onProgress: (current, total, currentFile) => {
        const now = Date.now();
        if (now - lastUpdate < 50 && current !== total) return;
        lastUpdate = now;
        setMode({ kind: "scanning", root, current, total, ...(currentFile ? { currentFile } : {}) });
      },
    })
      .then((result) => setMode({ kind: "results", result }))
      .catch((err) => setMode({ kind: "error", message: err instanceof Error ? err.message : String(err) }));
  }, [mode.kind === "scanning" ? mode.root : null]);

  if (mode.kind === "picker") {
    return (
      <FolderPicker
        initialDir={process.cwd()}
        onPick={(dir) => {
          scanStarted.current = false;
          setMode({ kind: "scanning", root: dir, current: 0, total: 0 });
        }}
      />
    );
  }

  if (mode.kind === "scanning") {
    return <ScanProgress root={mode.root} current={mode.current} total={mode.total} {...(mode.currentFile ? { currentFile: mode.currentFile } : {})} />;
  }

  if (mode.kind === "error") {
    setTimeout(() => exit(), 0);
    return (
      <Box paddingX={1}>
        <Text color="red">error: {mode.message}</Text>
      </Box>
    );
  }

  return <InteractiveResults result={mode.result} />;
}
