export type ParserKind = "tree-sitter" | "regex" | "lines-only";

export interface Language {
  id: string;
  name: string;
  color: string;
  extensions: string[];
  filenames?: string[];
  shebangs?: string[];
  lineComment?: string | string[];
  blockComment?: [string, string];
  parser: ParserKind;
  treeSitterGrammar?: string;
  regexParser?: string;
}

export const LANGUAGES: Language[] = [
  {
    id: "typescript",
    name: "TypeScript",
    color: "#3178c6",
    extensions: [".ts", ".mts", ".cts"],
    lineComment: "//",
    blockComment: ["/*", "*/"],
    parser: "tree-sitter",
    treeSitterGrammar: "typescript",
  },
  {
    id: "tsx",
    name: "TSX",
    color: "#3178c6",
    extensions: [".tsx"],
    lineComment: "//",
    blockComment: ["/*", "*/"],
    parser: "tree-sitter",
    treeSitterGrammar: "tsx",
  },
  {
    id: "javascript",
    name: "JavaScript",
    color: "#f1e05a",
    extensions: [".js", ".mjs", ".cjs", ".jsx"],
    lineComment: "//",
    blockComment: ["/*", "*/"],
    parser: "tree-sitter",
    treeSitterGrammar: "javascript",
  },
  {
    id: "python",
    name: "Python",
    color: "#3572A5",
    extensions: [".py", ".pyi", ".pyw"],
    shebangs: ["python", "python3"],
    lineComment: "#",
    blockComment: ['"""', '"""'],
    parser: "tree-sitter",
    treeSitterGrammar: "python",
  },
  {
    id: "go",
    name: "Go",
    color: "#00ADD8",
    extensions: [".go"],
    lineComment: "//",
    blockComment: ["/*", "*/"],
    parser: "tree-sitter",
    treeSitterGrammar: "go",
  },
  {
    id: "rust",
    name: "Rust",
    color: "#dea584",
    extensions: [".rs"],
    lineComment: ["//", "///", "//!"],
    blockComment: ["/*", "*/"],
    parser: "tree-sitter",
    treeSitterGrammar: "rust",
  },
  {
    id: "java",
    name: "Java",
    color: "#b07219",
    extensions: [".java"],
    lineComment: "//",
    blockComment: ["/*", "*/"],
    parser: "tree-sitter",
    treeSitterGrammar: "java",
  },
  {
    id: "c",
    name: "C",
    color: "#555555",
    extensions: [".c", ".h"],
    lineComment: "//",
    blockComment: ["/*", "*/"],
    parser: "tree-sitter",
    treeSitterGrammar: "c",
  },
  {
    id: "cpp",
    name: "C++",
    color: "#f34b7d",
    extensions: [".cpp", ".cxx", ".cc", ".hpp", ".hxx", ".hh"],
    lineComment: "//",
    blockComment: ["/*", "*/"],
    parser: "tree-sitter",
    treeSitterGrammar: "cpp",
  },
  {
    id: "csharp",
    name: "C#",
    color: "#178600",
    extensions: [".cs"],
    lineComment: "//",
    blockComment: ["/*", "*/"],
    parser: "tree-sitter",
    treeSitterGrammar: "c_sharp",
  },
  {
    id: "ruby",
    name: "Ruby",
    color: "#701516",
    extensions: [".rb", ".rake"],
    filenames: ["Rakefile", "Gemfile"],
    shebangs: ["ruby"],
    lineComment: "#",
    blockComment: ["=begin", "=end"],
    parser: "tree-sitter",
    treeSitterGrammar: "ruby",
  },
  {
    id: "php",
    name: "PHP",
    color: "#4F5D95",
    extensions: [".php", ".phtml"],
    lineComment: ["//", "#"],
    blockComment: ["/*", "*/"],
    parser: "tree-sitter",
    treeSitterGrammar: "php",
  },
  {
    id: "swift",
    name: "Swift",
    color: "#F05138",
    extensions: [".swift"],
    lineComment: "//",
    blockComment: ["/*", "*/"],
    parser: "tree-sitter",
    treeSitterGrammar: "swift",
  },
  {
    id: "kotlin",
    name: "Kotlin",
    color: "#A97BFF",
    extensions: [".kt", ".kts"],
    lineComment: "//",
    blockComment: ["/*", "*/"],
    parser: "tree-sitter",
    treeSitterGrammar: "kotlin",
  },
  {
    id: "scala",
    name: "Scala",
    color: "#c22d40",
    extensions: [".scala", ".sc"],
    lineComment: "//",
    blockComment: ["/*", "*/"],
    parser: "tree-sitter",
    treeSitterGrammar: "scala",
  },
  {
    id: "dart",
    name: "Dart",
    color: "#00B4AB",
    extensions: [".dart"],
    lineComment: "//",
    blockComment: ["/*", "*/"],
    parser: "tree-sitter",
    treeSitterGrammar: "dart",
  },
  {
    id: "lua",
    name: "Lua",
    color: "#000080",
    extensions: [".lua"],
    shebangs: ["lua"],
    lineComment: "--",
    blockComment: ["--[[", "]]"],
    parser: "tree-sitter",
    treeSitterGrammar: "lua",
  },
  {
    id: "elixir",
    name: "Elixir",
    color: "#6e4a7e",
    extensions: [".ex", ".exs"],
    lineComment: "#",
    parser: "tree-sitter",
    treeSitterGrammar: "elixir",
  },
  {
    id: "ocaml",
    name: "OCaml",
    color: "#3be133",
    extensions: [".ml", ".mli"],
    blockComment: ["(*", "*)"],
    parser: "tree-sitter",
    treeSitterGrammar: "ocaml",
  },
  {
    id: "elm",
    name: "Elm",
    color: "#60B5CC",
    extensions: [".elm"],
    lineComment: "--",
    blockComment: ["{-", "-}"],
    parser: "tree-sitter",
    treeSitterGrammar: "elm",
  },
  {
    id: "zig",
    name: "Zig",
    color: "#ec915c",
    extensions: [".zig"],
    lineComment: "//",
    parser: "tree-sitter",
    treeSitterGrammar: "zig",
  },
  {
    id: "solidity",
    name: "Solidity",
    color: "#AA6746",
    extensions: [".sol"],
    lineComment: "//",
    blockComment: ["/*", "*/"],
    parser: "tree-sitter",
    treeSitterGrammar: "solidity",
  },
  {
    id: "vue",
    name: "Vue",
    color: "#41b883",
    extensions: [".vue"],
    lineComment: "//",
    blockComment: ["<!--", "-->"],
    parser: "tree-sitter",
    treeSitterGrammar: "vue",
  },
  {
    id: "bash",
    name: "Shell",
    color: "#89e051",
    extensions: [".sh", ".bash", ".zsh", ".fish"],
    filenames: [".bashrc", ".zshrc", ".profile"],
    shebangs: ["sh", "bash", "zsh", "fish"],
    lineComment: "#",
    parser: "tree-sitter",
    treeSitterGrammar: "bash",
  },
  {
    id: "html",
    name: "HTML",
    color: "#e34c26",
    extensions: [".html", ".htm"],
    blockComment: ["<!--", "-->"],
    parser: "tree-sitter",
    treeSitterGrammar: "html",
  },
  {
    id: "css",
    name: "CSS",
    color: "#563d7c",
    extensions: [".css"],
    blockComment: ["/*", "*/"],
    parser: "tree-sitter",
    treeSitterGrammar: "css",
  },
  {
    id: "scss",
    name: "SCSS",
    color: "#c6538c",
    extensions: [".scss", ".sass"],
    lineComment: "//",
    blockComment: ["/*", "*/"],
    parser: "regex",
    regexParser: "scss",
  },
  {
    id: "json",
    name: "JSON",
    color: "#292929",
    extensions: [".json", ".jsonc"],
    filenames: ["package.json", "tsconfig.json"],
    parser: "tree-sitter",
    treeSitterGrammar: "json",
  },
  {
    id: "yaml",
    name: "YAML",
    color: "#cb171e",
    extensions: [".yaml", ".yml"],
    lineComment: "#",
    parser: "tree-sitter",
    treeSitterGrammar: "yaml",
  },
  {
    id: "toml",
    name: "TOML",
    color: "#9c4221",
    extensions: [".toml"],
    lineComment: "#",
    parser: "tree-sitter",
    treeSitterGrammar: "toml",
  },
  {
    id: "markdown",
    name: "Markdown",
    color: "#083fa1",
    extensions: [".md", ".markdown"],
    blockComment: ["<!--", "-->"],
    parser: "lines-only",
  },
  {
    id: "sql",
    name: "SQL",
    color: "#e38c00",
    extensions: [".sql"],
    lineComment: "--",
    blockComment: ["/*", "*/"],
    parser: "regex",
    regexParser: "sql",
  },
  {
    id: "haskell",
    name: "Haskell",
    color: "#5e5086",
    extensions: [".hs"],
    lineComment: "--",
    blockComment: ["{-", "-}"],
    parser: "regex",
    regexParser: "haskell",
  },
  {
    id: "r",
    name: "R",
    color: "#198CE7",
    extensions: [".r", ".R"],
    lineComment: "#",
    parser: "regex",
    regexParser: "r",
  },
  {
    id: "perl",
    name: "Perl",
    color: "#0298c3",
    extensions: [".pl", ".pm"],
    shebangs: ["perl"],
    lineComment: "#",
    parser: "regex",
    regexParser: "perl",
  },
  {
    id: "dockerfile",
    name: "Dockerfile",
    color: "#384d54",
    extensions: [".dockerfile"],
    filenames: ["Dockerfile", "dockerfile"],
    lineComment: "#",
    parser: "lines-only",
  },
  {
    id: "makefile",
    name: "Makefile",
    color: "#427819",
    extensions: [".mk"],
    filenames: ["Makefile", "makefile", "GNUmakefile"],
    lineComment: "#",
    parser: "lines-only",
  },
];

export const LANG_BY_ID = new Map(LANGUAGES.map((l) => [l.id, l]));

const EXT_INDEX = new Map<string, string>();
const FILENAME_INDEX = new Map<string, string>();
const SHEBANG_INDEX = new Map<string, string>();

for (const lang of LANGUAGES) {
  for (const ext of lang.extensions) {
    if (!EXT_INDEX.has(ext)) EXT_INDEX.set(ext, lang.id);
  }
  for (const name of lang.filenames ?? []) {
    FILENAME_INDEX.set(name, lang.id);
  }
  for (const sb of lang.shebangs ?? []) {
    SHEBANG_INDEX.set(sb, lang.id);
  }
}

export function languageByExtension(ext: string): string | undefined {
  return EXT_INDEX.get(ext.toLowerCase());
}

export function languageByFilename(name: string): string | undefined {
  return FILENAME_INDEX.get(name);
}

export function languageByShebang(interp: string): string | undefined {
  return SHEBANG_INDEX.get(interp);
}
