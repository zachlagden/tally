import { readFile as fsReadFile } from "node:fs/promises";
import { LANG_BY_ID } from "../languages.js";

export interface LineMetrics {
  bytes: number;
  chars: number;
  lines: number;
  codeLines: number;
  blankLines: number;
  commentLines: number;
}

export async function readAndCount(absPath: string, languageId: string): Promise<{
  metrics: LineMetrics;
  source: string;
}> {
  const buf = await fsReadFile(absPath);
  const text = buf.toString("utf8");
  const lang = LANG_BY_ID.get(languageId);
  const lineCommentTokens: string[] = lang?.lineComment
    ? Array.isArray(lang.lineComment) ? lang.lineComment : [lang.lineComment]
    : [];
  const blockCommentOpen = lang?.blockComment?.[0];
  const blockCommentClose = lang?.blockComment?.[1];

  let lines = 0;
  let blankLines = 0;
  let commentLines = 0;
  let inBlock = false;

  let lineStart = 0;
  const textLen = text.length;
  for (let i = 0; i <= textLen; i++) {
    if (i === textLen || text.charCodeAt(i) === 10) {
      let lineEnd = i;
      if (lineEnd > lineStart && text.charCodeAt(lineEnd - 1) === 13) lineEnd--;
      const rawLine = text.slice(lineStart, lineEnd);
      lines++;
      const trimmed = rawLine.trim();
      if (trimmed.length === 0) {
        blankLines++;
        if (inBlock) commentLines--;
      } else if (inBlock) {
        commentLines++;
        if (blockCommentClose && trimmed.includes(blockCommentClose)) inBlock = false;
      } else {
        let isComment = false;
        if (blockCommentOpen && trimmed.startsWith(blockCommentOpen)) {
          isComment = true;
          if (!blockCommentClose || !trimmed.slice(blockCommentOpen.length).includes(blockCommentClose)) {
            inBlock = true;
          }
        } else {
          for (const token of lineCommentTokens) {
            if (trimmed.startsWith(token)) { isComment = true; break; }
          }
        }
        if (isComment) commentLines++;
      }
      lineStart = i + 1;
    }
  }

  if (text.length === 0) lines = 0;
  if (commentLines < 0) commentLines = 0;
  const codeLines = Math.max(0, lines - blankLines - commentLines);

  return {
    source: text,
    metrics: {
      bytes: buf.byteLength,
      chars: text.length,
      lines,
      codeLines,
      blankLines,
      commentLines,
    },
  };
}
