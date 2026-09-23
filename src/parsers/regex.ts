import type { SymbolCounts } from "../types.js";
import { emptySymbols } from "../types.js";

type Counter = RegExp[] | ((source: string) => number);

type Patterns = {
  functions?: Counter;
  classes?: Counter;
  variables?: Counter;
  branches?: Counter;
};

const HASKELL_KEYWORDS = new Set([
  "module", "import", "where", "let", "in", "data", "type", "newtype", "class",
  "instance", "deriving", "infix", "infixl", "infixr", "default", "foreign",
]);

function countHaskellFunctions(source: string): number {
  const names = new Set<string>();
  for (const [, name] of source.matchAll(/^([a-z_][\w']*)\s*::/gm)) names.add(name!);
  for (const [, name] of source.matchAll(/^([a-z_][\w']*)\b[^\n=]*=(?!=)/gm)) {
    if (!HASKELL_KEYWORDS.has(name!)) names.add(name!);
  }
  return names.size;
}

const HASKELL: Patterns = {
  functions: countHaskellFunctions,
  classes: [/^\s*(data|newtype|type|class|instance)\s+[A-Z]/m],
  branches: [/\bif\b|\bcase\b/g, /^\s+\|[^\n=]*=/gm],
};

const SQL: Patterns = {
  functions: [/\bcreate\s+(or\s+replace\s+)?(function|procedure)\b/gi],
  classes: [/\bcreate\s+(table|view|index|trigger|schema)\b/gi],
  branches: [/\b(case|when|where)\b/gi],
};

const R: Patterns = {
  functions: [/<-\s*function\s*\(/g, /=\s*function\s*\(/g],
  variables: [/^\s*[a-zA-Z._][\w.]*\s*(?:<-|=)(?!\s*function\b)\s/gm],
  branches: [/\b(if|for|while)\b/g],
};

const PERL: Patterns = {
  functions: [/^\s*sub\s+\w+/gm],
  classes: [/^\s*package\s+\w/gm],
  variables: [/^\s*(my|our|local)\s+[\$@%]/gm],
  branches: [/\b(if|elsif|unless|for|foreach|while|until|given|when)\b/g],
};

const SCSS: Patterns = {
  functions: [/^\s*@function\s+/gm, /^\s*@mixin\s+/gm],
  classes: [/^[\s.&]*\.[\w-]+\s*[{,]/gm],
  variables: [/^\s*\$[\w-]+\s*:/gm],
};

const REGISTRY: Record<string, Patterns> = {
  haskell: HASKELL,
  sql: SQL,
  r: R,
  perl: PERL,
  scss: SCSS,
};

export function regexParse(parserKey: string, source: string): { symbols: SymbolCounts; complexity: number } {
  const patterns = REGISTRY[parserKey];
  if (!patterns) return { symbols: emptySymbols(), complexity: 0 };

  const stripped = strip(source);
  const symbols = emptySymbols();
  symbols.functions = countAll(patterns.functions, stripped);
  symbols.classes = countAll(patterns.classes, stripped);
  symbols.variables = countAll(patterns.variables, stripped);
  symbols.branches = countAll(patterns.branches, stripped);
  return { symbols, complexity: symbols.functions + symbols.branches };
}

function countAll(patterns: Counter | undefined, source: string): number {
  if (!patterns) return 0;
  if (typeof patterns === "function") return patterns(source);
  let total = 0;
  for (const p of patterns) {
    const flags = p.flags.includes("g") ? p.flags : p.flags + "g";
    const re = new RegExp(p.source, flags);
    let m: RegExpExecArray | null;
    while ((m = re.exec(source)) !== null) {
      total++;
      if (m.index === re.lastIndex) re.lastIndex++;
    }
  }
  return total;
}

function strip(source: string): string {
  return source
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''");
}
