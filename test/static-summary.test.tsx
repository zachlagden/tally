import { test, expect } from "vitest";
import React from "react";
import { render } from "ink-testing-library";
import { StaticSummary } from "../src/ui/StaticSummary.js";
import type { ScanResult } from "../src/types.js";
import { emptySymbols } from "../src/types.js";

function makeResult(): ScanResult {
  return {
    root: "/tmp/sample",
    scanDurationMs: 123,
    fileCount: 3,
    totalLines: 100,
    totalBytes: 3000,
    totalChars: 2987,
    languages: [
      {
        id: "typescript",
        name: "TypeScript",
        color: "#3178c6",
        files: 2,
        bytes: 2000,
        chars: 1990,
        lines: 80,
        codeLines: 70,
        blankLines: 5,
        commentLines: 5,
        symbols: { functions: 12, classes: 2, variables: 30, branches: 8 },
        complexity: 20,
      },
      {
        id: "json",
        name: "JSON",
        color: "#292929",
        files: 1,
        bytes: 1000,
        chars: 997,
        lines: 20,
        codeLines: 20,
        blankLines: 0,
        commentLines: 0,
        symbols: emptySymbols(),
        complexity: 0,
      },
    ],
    files: [],
    largestFiles: [],
    mostComplexFiles: [],
  };
}

test("StaticSummary renders the header, language rows, totals", () => {
  const { lastFrame } = render(<StaticSummary result={makeResult()} showSymbols={true} />);
  const frame = lastFrame() ?? "";
  expect(frame).toContain("tally");
  expect(frame).toContain("sample");
  expect(frame).toContain("TypeScript");
  expect(frame).toContain("JSON");
  expect(frame).toContain("100");
  expect(frame).toContain("12");
  expect(frame).toContain("Total");
});

test("StaticSummary shows · for languages without symbol parser", () => {
  const { lastFrame } = render(<StaticSummary result={makeResult()} showSymbols={true} />);
  const frame = lastFrame() ?? "";
  const lines = frame.split("\n");
  const jsonLine = lines.find((l) => l.includes("JSON"));
  expect(jsonLine).toMatch(/·/);
});
