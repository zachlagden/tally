import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
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

const MINIFIED_RE = /\.min\.(js|css)$/i;

export interface WalkResult {
  root: string;
  files: string[];
}

export async function walk(rootInput: string): Promise<WalkResult> {
  const root = resolve(rootInput);

  let raw: string[];
  if (existsSync(join(root, ".git"))) {
    raw = await gitLsFiles(root);
    if (raw.length === 0) raw = await globWalk(root);
  } else {
    raw = await globWalk(root);
  }

  const filtered: string[] = [];
  for (const rel of raw) {
    if (shouldKeep(rel)) filtered.push(rel);
  }
  return { root, files: filtered };
}

function shouldKeep(relPath: string): boolean {
  const segments = relPath.split(/[\\/]/);
  for (const seg of segments) {
    if (IGNORED_DIRS.has(seg)) return false;
  }
  if (MINIFIED_RE.test(relPath)) return false;
  const lastDot = relPath.lastIndexOf(".");
  if (lastDot >= 0) {
    const ext = relPath.slice(lastDot).toLowerCase();
    if (BINARY_EXTS.has(ext)) return false;
  }
  return true;
}

function gitLsFiles(root: string): Promise<string[]> {
  return new Promise((resolveP) => {
    const proc = spawn("git", ["ls-files", "-co", "--exclude-standard", "-z"], {
      cwd: root,
      stdio: ["ignore", "pipe", "ignore"],
    });
    const chunks: Buffer[] = [];
    proc.stdout.on("data", (c: Buffer) => chunks.push(c));
    proc.on("error", () => resolveP([]));
    proc.on("close", (code) => {
      if (code !== 0) return resolveP([]);
      const out = Buffer.concat(chunks).toString("utf8");
      const files = out.split("\0").filter(Boolean);
      resolveP(files);
    });
  });
}

async function globWalk(root: string): Promise<string[]> {
  return glob("**/*", {
    cwd: root,
    onlyFiles: true,
    dot: false,
    followSymbolicLinks: false,
    expandDirectories: false,
  });
}
