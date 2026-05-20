import React, { useEffect, useState, useMemo } from "react";
import { Box, Text, useInput, useApp } from "ink";
import { readdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { truncateMiddle } from "../util/format.js";

interface FolderEntry {
  name: string;
  abs: string;
}

interface Props {
  initialDir: string;
  onPick: (dir: string) => void;
}

type Row =
  | { kind: "scan" }
  | { kind: "parent"; abs: string }
  | { kind: "folder"; entry: FolderEntry };

const WINDOW = 14;

export function FolderPicker({ initialDir, onPick }: Props) {
  const { exit } = useApp();
  const [currentDir, setCurrentDir] = useState<string>(resolve(initialDir));
  const [entries, setEntries] = useState<FolderEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const dirents = await readdir(currentDir, { withFileTypes: true });
        const dirs = dirents
          .filter((d) => d.isDirectory())
          .filter((d) => d.name !== "node_modules" && d.name !== ".git")
          .filter((d) => !d.name.startsWith(".") || [".github", ".vscode"].includes(d.name))
          .map((d) => ({ name: d.name, abs: resolve(currentDir, d.name) }))
          .sort((a, b) => a.name.localeCompare(b.name));
        if (!cancelled) {
          setEntries(dirs);
          setError(null);
          setCursor(0);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setEntries([]);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [currentDir]);

  const isRoot = currentDir === dirname(currentDir);

  const rows: Row[] = useMemo(() => {
    const out: Row[] = [{ kind: "scan" }];
    if (!isRoot) out.push({ kind: "parent", abs: dirname(currentDir) });
    for (const e of entries) out.push({ kind: "folder", entry: e });
    return out;
  }, [entries, isRoot, currentDir]);

  useInput((input, key) => {
    if (input === "q") { exit(); return; }
    if (key.escape) { exit(); return; }
    if (key.downArrow || input === "j") {
      setCursor((c) => Math.min(rows.length - 1, c + 1));
    } else if (key.upArrow || input === "k") {
      setCursor((c) => Math.max(0, c - 1));
    } else if (key.return || input === "l" || key.rightArrow) {
      const row = rows[cursor];
      if (!row) return;
      if (row.kind === "scan") onPick(currentDir);
      else if (row.kind === "parent") setCurrentDir(row.abs);
      else setCurrentDir(row.entry.abs);
    } else if (input === "h" || key.leftArrow) {
      if (!isRoot) setCurrentDir(dirname(currentDir));
    } else if (input === "g") setCursor(0);
    else if (input === "G") setCursor(rows.length - 1);
  });

  const visible = windowAround(rows, cursor, WINDOW);

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box marginBottom={1}>
        <Text>
          <Text color="magentaBright" bold>{"▌ "}</Text>
          <Text bold color="whiteBright">tally  </Text>
          <Text dimColor>pick a folder to scan</Text>
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text dimColor>{"in  "}</Text>
        <Text color="cyanBright">{truncateMiddle(currentDir, 70)}</Text>
      </Box>

      {error ? (
        <Text color="red">cannot read directory: {error}</Text>
      ) : (
        <Box flexDirection="column">
          {visible.map(({ item: row, index }) => (
            <RowView key={rowKey(row, index)} row={row} selected={index === cursor} />
          ))}
          {rows.length > WINDOW && (
            <Text dimColor>{`  ${cursor + 1} / ${rows.length}`}</Text>
          )}
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>{"↑↓ navigate · ↵ open/scan · ← back · q quit"}</Text>
      </Box>
    </Box>
  );
}

function RowView({ row, selected }: { row: Row; selected: boolean }) {
  const arrow = selected ? "▸ " : "  ";
  if (row.kind === "scan") {
    return (
      <Text backgroundColor={selected ? "green" : undefined} color={selected ? "black" : "greenBright"} bold>
        {arrow}{"▶ scan this folder"}
      </Text>
    );
  }
  if (row.kind === "parent") {
    return (
      <Text backgroundColor={selected ? "blueBright" : undefined} color={selected ? "black" : undefined} dimColor={!selected}>
        {arrow}{".."}
      </Text>
    );
  }
  return (
    <Text backgroundColor={selected ? "blueBright" : undefined} color={selected ? "black" : "blueBright"}>
      {arrow}{row.entry.name}
    </Text>
  );
}

function rowKey(row: Row, index: number): string {
  if (row.kind === "scan") return "__scan__";
  if (row.kind === "parent") return "__parent__" + row.abs;
  return row.entry.abs + "::" + index;
}

function windowAround<T>(arr: T[], cursor: number, size: number): Array<{ item: T; index: number }> {
  if (arr.length <= size) return arr.map((item, index) => ({ item, index }));
  const half = Math.floor(size / 2);
  let start = Math.max(0, cursor - half);
  const end = Math.min(arr.length, start + size);
  start = Math.max(0, end - size);
  return arr.slice(start, end).map((item, i) => ({ item, index: start + i }));
}
