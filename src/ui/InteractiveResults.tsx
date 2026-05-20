import React, { useMemo, useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import type { ScanResult, LanguageStat, FileStat } from "../types.js";
import { LANG_BY_ID } from "../languages.js";
import { formatNumber, formatCompact, formatDuration, bar, padLeft, padRight, truncateMiddle } from "../util/format.js";
import { basename } from "node:path";

type SortKey = "lines" | "files" | "functions" | "classes" | "variables" | "complexity";
const SORT_KEYS: SortKey[] = ["lines", "files", "functions", "classes", "variables", "complexity"];
const SORT_LABEL: Record<SortKey, string> = {
  lines: "lines",
  files: "files",
  functions: "fns",
  classes: "cls",
  variables: "vars",
  complexity: "cx",
};

type View = { kind: "languages" } | { kind: "files"; languageId: string };

const BAR_WIDTH = 18;
const NAME_WIDTH = 13;
const PCT_WIDTH = 5;
const LINES_WIDTH = 8;
const FILES_WIDTH = 5;
const SYM_WIDTH = 5;

export function InteractiveResults({ result }: { result: ScanResult }) {
  const { exit } = useApp();
  const [view, setView] = useState<View>({ kind: "languages" });
  const [cursor, setCursor] = useState(0);
  const [sort, setSort] = useState<SortKey>("lines");
  const [reverse, setReverse] = useState(false);

  const sortedLangs = useMemo(() => sortLanguages(result.languages, sort, reverse), [result.languages, sort, reverse]);

  const filesForView: FileStat[] = useMemo(() => {
    if (view.kind !== "files") return [];
    const files = result.files.filter((f) => f.language === view.languageId);
    return sortFiles(files, sort, reverse);
  }, [result.files, view, sort, reverse]);

  const rowCount = view.kind === "languages" ? sortedLangs.length : filesForView.length;

  useInput((input, key) => {
    if (input === "q") { exit(); return; }
    if (key.escape || input === "h" || (key.leftArrow)) {
      if (view.kind !== "languages") {
        setView({ kind: "languages" });
        setCursor(0);
      }
      return;
    }
    if (key.downArrow || input === "j") {
      setCursor((c) => Math.min(rowCount - 1, c + 1));
    } else if (key.upArrow || input === "k") {
      setCursor((c) => Math.max(0, c - 1));
    } else if (input === "g") {
      setCursor(0);
    } else if (input === "G") {
      setCursor(Math.max(0, rowCount - 1));
    } else if (input === "s") {
      const i = SORT_KEYS.indexOf(sort);
      setSort(SORT_KEYS[(i + 1) % SORT_KEYS.length]!);
    } else if (input === "r") {
      setReverse((x) => !x);
    } else if (key.return || input === "l" || key.rightArrow) {
      if (view.kind === "languages") {
        const lang = sortedLangs[cursor];
        if (lang) {
          setView({ kind: "files", languageId: lang.id });
          setCursor(0);
        }
      }
    }
  });

  const totalCode = result.languages.reduce((s, l) => s + l.codeLines, 0);
  const maxLines = sortedLangs[0]?.codeLines ?? 1;
  const projectName = basename(result.root) || result.root;
  const currentLang = view.kind === "files" ? LANG_BY_ID.get(view.languageId) : undefined;

  return (
    <Box flexDirection="column" paddingX={1}>
      <Header projectName={projectName} root={result.root} result={result} />

      <Box marginTop={0}>
        <Text dimColor>{view.kind === "languages" ? "  ─ languages ─" : `  ─ files in `}</Text>
        {view.kind === "files" && currentLang && (
          <Text color={currentLang.color} bold>{currentLang.name}</Text>
        )}
        {view.kind === "files" && <Text dimColor>{` ─ (esc to back)`}</Text>}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>sort: <Text bold color="yellowBright">{SORT_LABEL[sort]}{reverse ? " ↑" : " ↓"}</Text>  ·  s=cycle sort  r=reverse</Text>
      </Box>

      <Box marginTop={1}>
        {view.kind === "languages" ? (
          <LanguagesView langs={sortedLangs} cursor={cursor} maxLines={maxLines} totalLines={totalCode} />
        ) : (
          <FilesView files={filesForView} cursor={cursor} />
        )}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>
          {view.kind === "languages"
            ? "↑↓ navigate · ↵ open language · s sort · r reverse · q quit"
            : "↑↓ navigate · ← back · s sort · r reverse · q quit"}
        </Text>
      </Box>
    </Box>
  );
}

function Header({ projectName, root, result }: { projectName: string; root: string; result: ScanResult }) {
  return (
    <Box flexDirection="column">
      <Text>
        <Text color="magentaBright" bold>{"▌ "}</Text>
        <Text bold color="whiteBright">tally  </Text>
        <Text bold>{projectName}</Text>
        <Text dimColor>  {truncateMiddle(root, 50)}</Text>
      </Text>
      <Text>
        <Text dimColor>{"  "}</Text>
        <Text bold>{formatNumber(result.fileCount)}</Text>
        <Text dimColor> files · </Text>
        <Text bold>{formatNumber(result.totalLines)}</Text>
        <Text dimColor> lines · </Text>
        <Text bold>{formatCompact(result.totalChars)}</Text>
        <Text dimColor> chars · </Text>
        <Text color="greenBright">{formatDuration(result.scanDurationMs)}</Text>
      </Text>
    </Box>
  );
}

function LanguagesView({ langs, cursor, maxLines, totalLines }: {
  langs: LanguageStat[];
  cursor: number;
  maxLines: number;
  totalLines: number;
}) {
  return (
    <Box flexDirection="column">
      <Text dimColor>
        {padRight("", NAME_WIDTH)}{padRight("", BAR_WIDTH)}{"  "}{padLeft("%", PCT_WIDTH)}{"  "}
        {padLeft("lines", LINES_WIDTH)}{"  "}{padLeft("files", FILES_WIDTH)}{"  "}
        {padLeft("fns", SYM_WIDTH)}{"  "}{padLeft("cls", SYM_WIDTH)}{"  "}{padLeft("vars", SYM_WIDTH)}{"  "}{padLeft("cx", SYM_WIDTH)}
      </Text>
      {langs.map((lang, i) => (
        <LangRow key={lang.id} lang={lang} maxLines={maxLines} totalLines={totalLines} selected={i === cursor} />
      ))}
    </Box>
  );
}

function LangRow({ lang, maxLines, totalLines, selected }: {
  lang: LanguageStat;
  maxLines: number;
  totalLines: number;
  selected: boolean;
}) {
  const pct = totalLines > 0 ? (lang.codeLines / totalLines) * 100 : 0;
  const barStr = bar(lang.codeLines, maxLines, BAR_WIDTH);
  const meta = LANG_BY_ID.get(lang.id);
  const hasSym = meta?.parser === "tree-sitter" || meta?.parser === "regex";
  const cell = (n: number) => hasSym ? padLeft(formatNumber(n), SYM_WIDTH) : padLeft("·", SYM_WIDTH);
  return (
    <Text backgroundColor={selected ? "blueBright" : undefined} color={selected ? "black" : undefined}>
      <Text>{selected ? "▸ " : "  "}</Text>
      <Text color={selected ? "black" : lang.color}>{padRight(lang.name, NAME_WIDTH - 2)}</Text>
      <Text color={selected ? "black" : lang.color}>{barStr}</Text>
      <Text>{"  "}</Text>
      <Text>{padLeft(`${pct.toFixed(1)}%`, PCT_WIDTH)}</Text>
      <Text>{"  "}</Text>
      <Text>{padLeft(formatNumber(lang.codeLines), LINES_WIDTH)}</Text>
      <Text>{"  "}</Text>
      <Text>{padLeft(formatNumber(lang.files), FILES_WIDTH)}</Text>
      <Text>{"  "}</Text>
      <Text>{cell(lang.symbols.functions)}</Text>
      <Text>{"  "}</Text>
      <Text>{cell(lang.symbols.classes)}</Text>
      <Text>{"  "}</Text>
      <Text>{cell(lang.symbols.variables)}</Text>
      <Text>{"  "}</Text>
      <Text>{hasSym ? padLeft(formatNumber(lang.complexity), SYM_WIDTH) : padLeft("·", SYM_WIDTH)}</Text>
    </Text>
  );
}

function FilesView({ files, cursor }: { files: FileStat[]; cursor: number }) {
  const visible = windowAround(files, cursor, 18);
  return (
    <Box flexDirection="column">
      <Text dimColor>
        {padRight("path", 50)}{"  "}{padLeft("lines", 7)}{"  "}{padLeft("fns", 5)}{"  "}{padLeft("cls", 5)}{"  "}{padLeft("vars", 5)}{"  "}{padLeft("cx", 5)}
      </Text>
      {visible.map(({ item: f, index }) => (
        <Text key={f.path} backgroundColor={index === cursor ? "blueBright" : undefined} color={index === cursor ? "black" : undefined}>
          <Text>{index === cursor ? "▸ " : "  "}</Text>
          <Text>{padRight(truncateMiddle(f.path, 48), 48)}</Text>
          <Text>{"  "}</Text>
          <Text>{padLeft(formatNumber(f.codeLines), 7)}</Text>
          <Text>{"  "}</Text>
          <Text>{padLeft(formatNumber(f.symbols.functions), 5)}</Text>
          <Text>{"  "}</Text>
          <Text>{padLeft(formatNumber(f.symbols.classes), 5)}</Text>
          <Text>{"  "}</Text>
          <Text>{padLeft(formatNumber(f.symbols.variables), 5)}</Text>
          <Text>{"  "}</Text>
          <Text>{padLeft(formatNumber(f.complexity), 5)}</Text>
        </Text>
      ))}
      {files.length > 18 && (
        <Text dimColor>{`  …${files.length - visible.length} more  (cursor ${cursor + 1} / ${files.length})`}</Text>
      )}
    </Box>
  );
}

function windowAround<T>(arr: T[], cursor: number, size: number): Array<{ item: T; index: number }> {
  if (arr.length <= size) return arr.map((item, index) => ({ item, index }));
  const half = Math.floor(size / 2);
  let start = Math.max(0, cursor - half);
  const end = Math.min(arr.length, start + size);
  start = Math.max(0, end - size);
  return arr.slice(start, end).map((item, i) => ({ item, index: start + i }));
}

function sortLanguages(langs: LanguageStat[], key: SortKey, reverse: boolean): LanguageStat[] {
  const sorted = [...langs].sort((a, b) => valueOf(a, key) - valueOf(b, key));
  return reverse ? sorted : sorted.reverse();
}

function sortFiles(files: FileStat[], key: SortKey, reverse: boolean): FileStat[] {
  const sorted = [...files].sort((a, b) => fileValue(a, key) - fileValue(b, key));
  return reverse ? sorted : sorted.reverse();
}

function valueOf(l: LanguageStat, k: SortKey): number {
  switch (k) {
    case "lines": return l.codeLines;
    case "files": return l.files;
    case "functions": return l.symbols.functions;
    case "classes": return l.symbols.classes;
    case "variables": return l.symbols.variables;
    case "complexity": return l.complexity;
  }
}

function fileValue(f: FileStat, k: SortKey): number {
  switch (k) {
    case "lines": return f.codeLines;
    case "files": return 1;
    case "functions": return f.symbols.functions;
    case "classes": return f.symbols.classes;
    case "variables": return f.symbols.variables;
    case "complexity": return f.complexity;
  }
}
