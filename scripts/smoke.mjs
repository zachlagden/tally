import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const [root, expectedLanguage] = process.argv.slice(2);
if (!root || !expectedLanguage) {
  console.error("usage: node scripts/smoke.mjs <repo-dir> <expected-top-language>");
  process.exit(2);
}

const cli = join(dirname(fileURLToPath(import.meta.url)), "..", "dist", "cli.js");

function tally(args) {
  const started = performance.now();
  const run = spawnSync(process.execPath, [cli, "--json", "--no-git", ...args, root], {
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  });
  if (run.status !== 0) throw new Error(`tally ${args.join(" ")} exited ${run.status}\n${run.stderr}`);
  const result = JSON.parse(run.stdout);
  delete result.scanDurationMs;
  return { result, seconds: (performance.now() - started) / 1000 };
}

function fail(message) {
  console.error(`FAIL ${root}: ${message}`);
  process.exit(1);
}

const auto = tally([]);
const single = tally(["--threads", "0"]);
const pooled = tally(["--threads", "2"]);
const lines = tally(["--no-symbols"]);

const top = pooled.result.languages[0];
if (top?.id !== expectedLanguage) fail(`expected top language ${expectedLanguage}, got ${top?.id}`);
if (!(top.functions > 0)) fail(`no functions found for ${top.id}`);
if (pooled.result.skippedFiles.length > 0) fail(`skipped files: ${JSON.stringify(pooled.result.skippedFiles)}`);
if (JSON.stringify(pooled.result) !== JSON.stringify(single.result)) fail("worker pool and single-thread results differ");
if (JSON.stringify(auto.result) !== JSON.stringify(single.result)) fail("default and single-thread results differ");
if (lines.result.totalLines !== pooled.result.totalLines) fail("--no-symbols changed the line totals");

console.log(
  `ok ${root}: ${pooled.result.fileCount} files, ${top.id} ${top.codeLines} code lines, ` +
    `${top.functions} functions, ${top.classes} classes | ` +
    `auto ${auto.seconds.toFixed(2)}s, single ${single.seconds.toFixed(2)}s, 2 threads ${pooled.seconds.toFixed(2)}s, no-symbols ${lines.seconds.toFixed(2)}s`,
);
