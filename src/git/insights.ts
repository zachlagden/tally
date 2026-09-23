import { spawn } from "node:child_process";
import type { GitInsights } from "../types.js";

export async function gatherGitInsights(root: string): Promise<GitInsights | undefined> {
  const [shortlog, firstDate, commitCountStr] = await Promise.all([
    run(["shortlog", "-sne", "HEAD"], root),
    run(["log", "--max-parents=0", "--format=%aI", "HEAD"], root),
    run(["rev-list", "--count", "HEAD"], root),
  ]);

  if (!shortlog || !firstDate || !commitCountStr) return undefined;

  const contributors = parseShortlog(shortlog);
  if (contributors.length === 0) return undefined;
  const totalCommits = contributors.reduce((s, c) => s + c.commits, 0);
  const top = contributors[0]!;
  const firstCommitDate = firstDate.trim().split(/\s+/).sort((a, b) => Date.parse(a) - Date.parse(b))[0] ?? "";
  const ageDays = firstCommitDate
    ? Math.max(0, Math.floor((Date.now() - new Date(firstCommitDate).getTime()) / (24 * 3600 * 1000)))
    : 0;
  const commitCount = parseInt(commitCountStr.trim(), 10) || 0;

  return {
    contributors: contributors.length,
    topContributor: {
      name: top.name,
      commits: top.commits,
      percentage: totalCommits > 0 ? (top.commits / totalCommits) * 100 : 0,
    },
    firstCommitDate,
    commitCount,
    ageDays,
  };
}

function parseShortlog(out: string): Array<{ name: string; commits: number }> {
  const lines = out.split("\n").map((l) => l.trim()).filter(Boolean);
  const rows: Array<{ name: string; commits: number }> = [];
  for (const line of lines) {
    const match = line.match(/^\s*(\d+)\s+(.+?)\s*<.*>\s*$/);
    if (match) {
      rows.push({ commits: parseInt(match[1]!, 10), name: match[2]! });
    }
  }
  return rows.sort((a, b) => b.commits - a.commits);
}

function run(args: string[], cwd: string): Promise<string | null> {
  return new Promise((resolveP) => {
    const proc = spawn("git", args, { cwd, stdio: ["ignore", "pipe", "ignore"] });
    const chunks: Buffer[] = [];
    proc.stdout.on("data", (c: Buffer) => chunks.push(c));
    proc.on("error", () => resolveP(null));
    proc.on("close", (code) => {
      if (code !== 0) return resolveP(null);
      resolveP(Buffer.concat(chunks).toString("utf8"));
    });
  });
}
