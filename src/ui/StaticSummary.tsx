import React from "react";
import { Box, Text } from "ink";
import type { ScanResult, LanguageStat, FileStat } from "../types.js";
import { formatNumber, formatCompact, formatDuration, bar, padLeft, padRight, truncateMiddle } from "../util/format.js";
import { LANG_BY_ID } from "../languages.js";
import { basename } from "node:path";

const BAR_WIDTH = 18;
const NAME_WIDTH = 13;
const PCT_WIDTH = 5;
const LINES_WIDTH = 8;
const FILES_WIDTH = 5;
const SYM_WIDTH = 5;

export function StaticSummary({ result, showSymbols }: { result: ScanResult; showSymbols: boolean }) {
  const root = result.root;
  const projectName = basename(root) || root;
  const maxLines = result.languages[0]?.codeLines ?? 1;
  const totalCode = result.languages.reduce((s, l) => s + l.codeLines, 0);
  const anySymbols = showSymbols && result.languages.some((l) => l.symbols.functions + l.symbols.classes + l.symbols.variables > 0);
  const anyComplexity = showSymbols && result.mostComplexFiles.some((f) => f.complexity > 0);

  return (
    <Box flexDirection="column" paddingX={1} paddingY={0}>
      <Header projectName={projectName} root={root} result={result} />

      <SectionTitle label="Languages" />
      <ColumnHeaders showSymbols={anySymbols} />
      {result.languages.map((lang) => (
        <LanguageRow
          key={lang.id}
          lang={lang}
          maxLines={maxLines}
          totalLines={totalCode}
          showSymbols={anySymbols}
        />
      ))}
      <TotalsRow result={result} showSymbols={anySymbols} totalLines={totalCode} />

      {result.largestFiles.length > 0 && (
        <>
          <Spacer />
          <SectionTitle label="Largest files" />
          {result.largestFiles.map((f, i) => (
            <FileRow key={f.path} file={f} index={i + 1} metricLabel="LOC" metricValue={f.codeLines} showFns={anySymbols} />
          ))}
        </>
      )}

      {anyComplexity && (
        <>
          <Spacer />
          <SectionTitle label="Most complex files" />
          {result.mostComplexFiles.map((f, i) => (
            <FileRow key={f.path} file={f} index={i + 1} metricLabel="cx" metricValue={f.complexity} showFns={anySymbols} />
          ))}
        </>
      )}

      {result.git && (
        <>
          <Spacer />
          <GitFooter git={result.git} />
        </>
      )}
    </Box>
  );
}

function Spacer() {
  return <Text> </Text>;
}

function Header({ projectName, root, result }: { projectName: string; root: string; result: ScanResult }) {
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text>
        <Text color="magentaBright" bold>{"▌ "}</Text>
        <Text bold color="whiteBright">tally  </Text>
        <Text bold>{projectName}</Text>
        <Text dimColor>  {truncateMiddle(root, 56)}</Text>
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

function SectionTitle({ label }: { label: string }) {
  const ruleWidth = Math.max(0, 76 - label.length - 4);
  return (
    <Text>
      <Text bold color="cyanBright">{label}</Text>
      <Text dimColor>{"  " + "─".repeat(ruleWidth)}</Text>
    </Text>
  );
}

function ColumnHeaders({ showSymbols }: { showSymbols: boolean }) {
  return (
    <Text dimColor>
      <Text>{padRight("", NAME_WIDTH)}</Text>
      <Text>{padRight("", BAR_WIDTH)}</Text>
      <Text>{"  "}</Text>
      <Text>{padLeft("%", PCT_WIDTH)}</Text>
      <Text>{"  "}</Text>
      <Text>{padLeft("lines", LINES_WIDTH)}</Text>
      <Text>{"  "}</Text>
      <Text>{padLeft("files", FILES_WIDTH)}</Text>
      {showSymbols && (
        <>
          <Text>{"  "}</Text>
          <Text>{padLeft("fns", SYM_WIDTH)}</Text>
          <Text>{"  "}</Text>
          <Text>{padLeft("cls", SYM_WIDTH)}</Text>
          <Text>{"  "}</Text>
          <Text>{padLeft("vars", SYM_WIDTH)}</Text>
        </>
      )}
    </Text>
  );
}

function LanguageRow({ lang, maxLines, totalLines, showSymbols }: {
  lang: LanguageStat;
  maxLines: number;
  totalLines: number;
  showSymbols: boolean;
}) {
  const pct = totalLines > 0 ? (lang.codeLines / totalLines) * 100 : 0;
  const barStr = bar(lang.codeLines, maxLines, BAR_WIDTH);
  const meta = LANG_BY_ID.get(lang.id);
  const hasSymbolParser = meta?.parser === "tree-sitter" || meta?.parser === "regex";
  const symCell = (n: number) => hasSymbolParser ? padLeft(formatNumber(n), SYM_WIDTH) : padLeft("·", SYM_WIDTH);
  return (
    <Text>
      <Text color={lang.color}>{padRight(lang.name, NAME_WIDTH)}</Text>
      <Text color={lang.color}>{barStr}</Text>
      <Text>{"  "}</Text>
      <Text>{padLeft(`${pct.toFixed(1)}%`, PCT_WIDTH)}</Text>
      <Text>{"  "}</Text>
      <Text>{padLeft(formatNumber(lang.codeLines), LINES_WIDTH)}</Text>
      <Text>{"  "}</Text>
      <Text dimColor>{padLeft(formatNumber(lang.files), FILES_WIDTH)}</Text>
      {showSymbols && (
        <>
          <Text>{"  "}</Text>
          {hasSymbolParser ? <Text>{padLeft(formatNumber(lang.symbols.functions), SYM_WIDTH)}</Text> : <Text dimColor>{padLeft("·", SYM_WIDTH)}</Text>}
          <Text>{"  "}</Text>
          {hasSymbolParser ? <Text>{padLeft(formatNumber(lang.symbols.classes), SYM_WIDTH)}</Text> : <Text dimColor>{padLeft("·", SYM_WIDTH)}</Text>}
          <Text>{"  "}</Text>
          {hasSymbolParser ? <Text>{padLeft(formatNumber(lang.symbols.variables), SYM_WIDTH)}</Text> : <Text dimColor>{padLeft("·", SYM_WIDTH)}</Text>}
        </>
      )}
    </Text>
  );
}

function TotalsRow({ result, showSymbols, totalLines }: { result: ScanResult; showSymbols: boolean; totalLines: number }) {
  const totalFns = result.languages.reduce((s, l) => s + l.symbols.functions, 0);
  const totalCls = result.languages.reduce((s, l) => s + l.symbols.classes, 0);
  const totalVar = result.languages.reduce((s, l) => s + l.symbols.variables, 0);
  const totalFiles = result.languages.reduce((s, l) => s + l.files, 0);
  return (
    <Box marginTop={1}>
      <Text>
        <Text bold>{padRight("Total", NAME_WIDTH)}</Text>
        <Text dimColor>{"·".repeat(BAR_WIDTH)}</Text>
        <Text>{"  "}</Text>
        <Text dimColor>{padLeft("100%", PCT_WIDTH)}</Text>
        <Text>{"  "}</Text>
        <Text bold>{padLeft(formatNumber(totalLines), LINES_WIDTH)}</Text>
        <Text>{"  "}</Text>
        <Text bold>{padLeft(formatNumber(totalFiles), FILES_WIDTH)}</Text>
        {showSymbols && (
          <>
            <Text>{"  "}</Text>
            <Text bold>{padLeft(formatNumber(totalFns), SYM_WIDTH)}</Text>
            <Text>{"  "}</Text>
            <Text bold>{padLeft(formatNumber(totalCls), SYM_WIDTH)}</Text>
            <Text>{"  "}</Text>
            <Text bold>{padLeft(formatNumber(totalVar), SYM_WIDTH)}</Text>
          </>
        )}
      </Text>
    </Box>
  );
}

function FileRow({ file, index, metricLabel, metricValue, showFns }: {
  file: FileStat;
  index: number;
  metricLabel: string;
  metricValue: number;
  showFns: boolean;
}) {
  return (
    <Text>
      <Text dimColor>{padLeft(`${index}.`, 3)}{" "}</Text>
      <Text>{padRight(truncateMiddle(file.path, 50), 51)}</Text>
      <Text>{padLeft(formatNumber(metricValue), 7)}</Text>
      <Text dimColor> {metricLabel}</Text>
      {showFns && file.symbols.functions > 0 && (
        <>
          <Text>{padLeft(formatNumber(file.symbols.functions), 5)}</Text>
          <Text dimColor> fns</Text>
        </>
      )}
    </Text>
  );
}

function GitFooter({ git }: { git: NonNullable<ScanResult["git"]> }) {
  const ageStr =
    git.ageDays < 60
      ? `${git.ageDays}d old`
      : git.ageDays < 730
        ? `${Math.round(git.ageDays / 30)}mo old`
        : `${(git.ageDays / 365).toFixed(1)}y old`;
  return (
    <Text>
      <Text dimColor>repo · </Text>
      <Text bold>{git.contributors}</Text>
      <Text dimColor> contributors · top: </Text>
      <Text bold>{git.topContributor.name}</Text>
      <Text dimColor> ({git.topContributor.percentage.toFixed(0)}%) · </Text>
      <Text>{ageStr}</Text>
      <Text dimColor> · </Text>
      <Text bold>{formatNumber(git.commitCount)}</Text>
      <Text dimColor> commits</Text>
    </Text>
  );
}
