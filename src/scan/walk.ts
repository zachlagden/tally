import { spawn } from "node:child_process";
import { basename, resolve } from "node:path";
import { glob } from "tinyglobby";

const BINARY_EXTS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".ico", ".tiff", ".tif",
  ".svg", ".pdf", ".psd", ".ai", ".sketch", ".fig",
  ".mp3", ".mp4", ".mov", ".avi", ".wav", ".flac", ".ogg", ".webm", ".mkv",
  ".ttf", ".otf", ".woff", ".woff2", ".eot",
  ".zip", ".tar", ".gz", ".bz2", ".xz", ".7z", ".rar",
  ".exe", ".dll", ".so", ".dylib", ".a", ".o", ".obj", ".class", ".pyc", ".wasm",
  ".bin", ".dat", ".db", ".sqlite", ".sqlite3",
  ".lock",
]);

const IGNORED_DIRS = new Set([
  "node_modules", ".git", ".svn", ".hg", "dist", "build", "out", ".next",
  ".nuxt", ".turbo", ".cache", "__pycache__", ".pytest_cache", ".mypy_cache",
  ".venv", "venv", "env", "target", "vendor", ".gradle", ".idea", ".vscode",
  "coverage", ".nyc_output", ".parcel-cache",
]);

const LOCKFILES = new Set([
  "pnpm-lock.yaml", "package-lock.json", "npm-shrinkwrap.json", "yarn.lock",
  "bun.lock", "bun.lockb", "Cargo.lock", "poetry.lock", "uv.lock", "Pipfile.lock",
  "composer.lock", "Gemfile.lock", "go.sum", "flake.lock", "packages.lock.json",
  "mix.lock", "pubspec.lock", "Podfile.lock", "gradle.lockfile",
]);

const MINIFIED_RE = /\.min\.(js|css)$/i;

export interface WalkResult {
  root: string;
  files: string[];
  inGitRepo: boolean;
}

export async function walk(rootInput: string): Promise<WalkResult> {
  const root = resolve(rootInput);

  const inGitRepo = (await git(["rev-parse", "--is-inside-work-tree"], root))?.trim() === "true";
  const listed = inGitRepo ? await gitLsFiles(root) : undefined;
  const raw = listed ?? (await globWalk(root));
  return { root, files: raw.filter(shouldKeep), inGitRepo };
}

function shouldKeep(relPath: string): boolean {
  const segments = relPath.split(/[\\/]/);
  for (const seg of segments) {
    if (IGNORED_DIRS.has(seg)) return false;
  }
  if (LOCKFILES.has(basename(relPath))) return false;
  if (MINIFIED_RE.test(relPath)) return false;
  const lastDot = relPath.lastIndexOf(".");
  if (lastDot >= 0) {
    const ext = relPath.slice(lastDot).toLowerCase();
    if (BINARY_EXTS.has(ext)) return false;
  }
  return true;
}

async function gitLsFiles(root: string): Promise<string[] | undefined> {
  const out = await git(["ls-files", "-co", "--exclude-standard", "-z"], root);
  return out === undefined ? undefined : out.split("\0").filter(Boolean);
}

function git(args: string[], cwd: string): Promise<string | undefined> {
  return new Promise((resolveP) => {
    const proc = spawn("git", args, { cwd, stdio: ["ignore", "pipe", "ignore"] });
    const chunks: Buffer[] = [];
    proc.stdout.on("data", (c: Buffer) => chunks.push(c));
    proc.on("error", () => resolveP(undefined));
    proc.on("close", (code) => {
      resolveP(code === 0 ? Buffer.concat(chunks).toString("utf8") : undefined);
    });
  });
}

async function globWalk(root: string): Promise<string[]> {
  return glob("**/*", {
    cwd: root,
    onlyFiles: true,
    dot: true,
    followSymbolicLinks: false,
    expandDirectories: false,
  });
}
