import { basename, extname } from "node:path";
import { languageByExtension, languageByFilename, languageByShebang } from "../languages.js";

export function classifyByPath(relPath: string): string | undefined {
  const name = basename(relPath);
  const ext = extname(name);
  if (ext) {
    const byExt = languageByExtension(ext);
    if (byExt) return byExt;
  }
  return languageByFilename(name);
}

export function classifyByContent(firstBytes: Buffer): string | undefined {
  if (firstBytes.length < 2) return undefined;
  if (firstBytes[0] !== 0x23 || firstBytes[1] !== 0x21) return undefined;
  const newline = firstBytes.indexOf(0x0a);
  const end = newline >= 0 ? newline : Math.min(firstBytes.length, 256);
  const line = firstBytes.slice(2, end).toString("utf8").trim();
  if (!line) return undefined;
  const parts = line.split(/\s+/);
  const interp = parts[0]?.split("/").pop();
  if (interp === "env" && parts.length > 1) {
    return languageByShebang(parts[1]!);
  }
  return interp ? languageByShebang(interp) : undefined;
}

export function isBinary(buf: Buffer): boolean {
  const probe = Math.min(buf.length, 4096);
  for (let i = 0; i < probe; i++) {
    if (buf[i] === 0) return true;
  }
  return false;
}
