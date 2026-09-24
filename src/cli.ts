import { Command, InvalidArgumentError } from "commander";
import { resolve } from "node:path";
import { existsSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { setFlagsFromString } from "node:v8";
import { LANG_BY_ID } from "./languages.js";
import { scan } from "./scan/index.js";
import { toJson } from "./output/json.js";
import { toCsv } from "./output/csv.js";

setFlagsFromString("--liftoff-only");

process.stdout.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EPIPE") process.exit(0);
  throw err;
});

const { version } = createRequire(import.meta.url)("../package.json") as { version: string };

function parseCount(minimum: number) {
  return (value: string): number => {
    const n = Number(value);
    if (!Number.isInteger(n) || n < minimum) {
      throw new InvalidArgumentError(`expected a whole number of at least ${minimum}, got "${value}"`);
    }
    return n;
  };
}

function parseSeconds(value: string): number {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new InvalidArgumentError(`expected a positive number of seconds, got "${value}"`);
  }
  return seconds;
}

function parseLanguages(value: string): string[] {
  const ids = value.split(",").map((s) => s.trim()).filter(Boolean);
  const unknown = ids.filter((id) => !LANG_BY_ID.has(id));
  if (ids.length === 0 || unknown.length > 0) {
    const known = [...LANG_BY_ID.keys()].sort().join(", ");
    throw new InvalidArgumentError(`unknown language id${unknown.length === 1 ? "" : "s"} "${unknown.join(", ")}". Known ids: ${known}`);
  }
  return ids;
}

const program = new Command();

program
  .name("tally")
  .description("Beautiful, fast, multi-language code statistics")
  .version(version)
  .argument("[path]", "directory to scan (omit for interactive folder picker)")
  .option("-i, --interactive", "force interactive TUI even when a path is given")
  .option("--json", "emit JSON to stdout (no ANSI)")
  .option("--csv", "emit CSV to stdout (no ANSI)")
  .option("--no-symbols", "skip tree-sitter symbol parsing (faster, lines only)")
  .option("--no-git", "skip git insights even when .git exists")
  .option("--top <n>", "top-N count for largest/complex panels", parseCount(1), 10)
  .option("--lang <ids>", "comma-separated language ids to restrict to", parseLanguages)
  .option("--threads <n>", "worker threads for parsing (0 = single thread, default: auto)", parseCount(0))
  .option("--parse-timeout <seconds>", "give up on symbols for a file after this long; its lines are still counted (worker threads only)", parseSeconds, 60)
  .action(async (pathArg: string | undefined, opts) => {
    const wantsMachine = opts.json || opts.csv;
    const wantsInteractive = !!opts.interactive || (!pathArg && !wantsMachine);

    const scanOptions = {
      topN: opts.top ?? 10,
      includeSymbols: opts.symbols !== false,
      includeGit: opts.git !== false,
      ...(opts.lang ? { languages: opts.lang } : {}),
      ...(opts.threads !== undefined ? { threads: opts.threads } : {}),
      parseTimeoutMs: opts.parseTimeout * 1000,
    };

    if (wantsInteractive) {
      if (!process.stdin.isTTY && !pathArg) {
        console.error("tally: interactive TUI requires a TTY. Pass a folder path: `tally ./some-folder`");
        process.exit(1);
      }
      const initialPath = pathArg ? resolve(pathArg) : undefined;
      if (initialPath && (!existsSync(initialPath) || !statSync(initialPath).isDirectory())) {
        console.error(`tally: not a directory: ${initialPath}`);
        process.exit(1);
      }
      if (!process.stdin.isTTY && pathArg) {
        const result = await scan({ root: resolve(pathArg), ...scanOptions });
        const { renderStatic } = await import("./ui/render.js");
        await renderStatic(result, opts.symbols !== false);
        return;
      }
      const { renderApp } = await import("./ui/render.js");
      await renderApp(initialPath, scanOptions);
      return;
    }

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

    const { renderStatic } = await import("./ui/render.js");
    await renderStatic(result, opts.symbols !== false);
  });

program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
