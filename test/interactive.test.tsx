import { test, expect } from "vitest";
import React from "react";
import { render } from "ink-testing-library";
import { InteractiveResults } from "../src/ui/InteractiveResults.js";
import type { ScanResult } from "../src/types.js";
import { emptySymbols } from "../src/types.js";

function makeResult(): ScanResult {
  return {
    root: "/tmp/x",
    scanDurationMs: 100,
    fileCount: 2,
    totalLines: 50,
    totalBytes: 1000,
    totalChars: 990,
    languages: [
      {
        id: "typescript", name: "TypeScript", color: "#3178c6",
        files: 1, bytes: 600, chars: 590, lines: 30, codeLines: 25,
        blankLines: 3, commentLines: 2,
        symbols: { functions: 4, classes: 1, variables: 5, branches: 3 },
        complexity: 7,
      },
      {
        id: "python", name: "Python", color: "#3572A5",
        files: 1, bytes: 400, chars: 400, lines: 20, codeLines: 18,
        blankLines: 2, commentLines: 0,
        symbols: { functions: 2, classes: 1, variables: 3, branches: 1 },
        complexity: 3,
      },
    ],
    files: [
      { path: "a.ts", absPath: "/tmp/x/a.ts", language: "typescript", bytes: 600, chars: 590, lines: 30, codeLines: 25, blankLines: 3, commentLines: 2, symbols: { functions: 4, classes: 1, variables: 5, branches: 3 }, complexity: 7 },
      { path: "b.py", absPath: "/tmp/x/b.py", language: "python", bytes: 400, chars: 400, lines: 20, codeLines: 18, blankLines: 2, commentLines: 0, symbols: { functions: 2, classes: 1, variables: 3, branches: 1 }, complexity: 3 },
    ],
    largestFiles: [],
    mostComplexFiles: [],
    skippedFiles: [],
    symbolTimeouts: [],
  };
}

test("InteractiveResults renders header, sort indicator, language rows", () => {
  const { lastFrame } = render(<InteractiveResults result={makeResult()} />);
  const frame = lastFrame() ?? "";
  expect(frame).toContain("tally");
  expect(frame).toContain("languages");
  expect(frame).toContain("TypeScript");
  expect(frame).toContain("Python");
  expect(frame).toContain("sort:");
  expect(frame).toContain("lines");
  expect(frame).toContain("↑↓ navigate");
});
