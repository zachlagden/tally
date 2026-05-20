import React from "react";
import { render } from "ink";
import { Command } from "commander";
import { resolve } from "node:path";
import { existsSync, statSync } from "node:fs";
import { scan } from "./scan/index.js";
import { StaticSummary } from "./ui/StaticSummary.js";
import { App } from "./ui/App.js";
import { toJson } from "./output/json.js";
import { toCsv } from "./output/csv.js";

const program = new Command();

program
  .name("tally")
  .description("Beautiful, fast, multi-language code statistics")
  .version("0.1.0")
  .argument("[path]", "directory to scan (omit for interactive folder picker)")
  .option("-i, --interactive", "force interactive TUI even when a path is given")
  .option("--json", "emit JSON to stdout (no ANSI)")
  .option("--csv", "emit CSV to stdout (no ANSI)")
  .option("--no-symbols", "skip tree-sitter symbol parsing (faster, lines only)")
  .option("--no-git", "skip git insights even when .git exists")
  .option("--top <n>", "top-N count for largest/complex panels", (v) => parseInt(v, 10), 10)
  .option("--lang <ids>", "comma-separated language ids to restrict to", (v) => v.split(",").map((s) => s.trim()))
  .action(async (pathArg: string | undefined, opts) => {
    const wantsMachine = opts.json || opts.csv;
    const wantsInteractive = !!opts.interactive || (!pathArg && !wantsMachine);

    const scanOptions = {
      topN: opts.top ?? 10,
      includeSymbols: opts.symbols !== false,
      includeGit: opts.git !== false,
      ...(opts.lang ? { languages: opts.lang } : {}),
    };

    // Interactive path: picker (optional) + scan + interactive results
    if (wantsInteractive) {
      if (!process.stdin.isTTY) {
        if (pathArg) {
          // Fallback: render static summary when interactive can't run
          // (e.g. CI logs, pipes)
        } else {
          console.error("tally: interactive TUI requires a TTY. Pass a folder path: `tally ./some-folder`");
          process.exit(1);
        }
      }
      const initialPath = pathArg ? resolve(pathArg) : undefined;
      if (initialPath && (!existsSync(initialPath) || !statSync(initialPath).isDirectory())) {
        console.error(`tally: not a directory: ${initialPath}`);
        process.exit(1);
      }
      if (!process.stdin.isTTY && pathArg) {
        const target = resolve(pathArg);
        const result = await scan({ root: target, ...scanOptions });
        const { waitUntilExit } = render(
          <StaticSummary result={result} showSymbols={opts.symbols !== false} />,
          { exitOnCtrlC: true }
        );
        await waitUntilExit();
        return;
      }
      const { waitUntilExit } = render(
        <App {...(initialPath ? { initialPath } : {})} scanOptions={scanOptions} />,
        { exitOnCtrlC: true }
      );
      await waitUntilExit();
      return;
    }

    // Non-interactive path: scan once, then render static / json / csv
    const target = pathArg ? resolve(pathArg) : process.cwd();
    if (!existsSync(target) || !statSync(target).isDirectory()) {
      console.error(`tally: not a directory: ${target}`);
      process.exit(1);
    }

    const result = await scan({ root: target, ...scanOptions });

    if (opts.json) {
      process.stdout.write(toJson(result) + "\n");
      return;
    }
    if (opts.csv) {
      process.stdout.write(toCsv(result) + "\n");
      return;
    }

    const { waitUntilExit } = render(
      <StaticSummary result={result} showSymbols={opts.symbols !== false} />,
      { exitOnCtrlC: true }
    );
    await waitUntilExit();
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
