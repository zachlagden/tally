import { LANG_BY_ID } from "../languages.js";

export interface LineMetrics {
  lines: number;
  codeLines: number;
  blankLines: number;
  commentLines: number;
}

interface CommentSyntax {
  lineTokens: string[];
  blockOpen: string | undefined;
  blockClose: string | undefined;
}

const syntaxCache = new Map<string, CommentSyntax>();

function commentSyntaxFor(languageId: string): CommentSyntax {
  const cached = syntaxCache.get(languageId);
  if (cached) return cached;
  const lang = LANG_BY_ID.get(languageId);
  const lineComment = lang?.lineComment;
  const syntax: CommentSyntax = {
    lineTokens: lineComment === undefined ? [] : Array.isArray(lineComment) ? lineComment : [lineComment],
    blockOpen: lang?.blockComment?.[0],
    blockClose: lang?.blockComment?.[1],
  };
  syntaxCache.set(languageId, syntax);
  return syntax;
}

export function countLines(text: string, languageId: string): LineMetrics {
  const { lineTokens, blockOpen, blockClose } = commentSyntaxFor(languageId);
  const textLength = text.length;

  let lines = 0;
  let blankLines = 0;
  let commentLines = 0;
  let inBlock = false;
  let lineStart = 0;

  while (lineStart < textLength) {
    const newline = text.indexOf("\n", lineStart);
    const lineEnd = newline === -1 ? textLength : newline;
    const trimmed = text.slice(lineStart, lineEnd).trim();
    lines++;

    if (trimmed.length === 0) {
      blankLines++;
    } else if (inBlock) {
      commentLines++;
      if (blockClose && trimmed.includes(blockClose)) inBlock = false;
    } else if (blockOpen && trimmed.startsWith(blockOpen)) {
      commentLines++;
      const rest = trimmed.slice(blockOpen.length);
      if (!blockClose || !rest.includes(blockClose)) inBlock = true;
    } else if (lineTokens.some((token) => trimmed.startsWith(token))) {
      commentLines++;
    }

    lineStart = lineEnd + 1;
  }

  return {
    lines,
    codeLines: lines - blankLines - commentLines,
    blankLines,
    commentLines,
  };
}
