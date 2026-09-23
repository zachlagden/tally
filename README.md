# tally

Beautiful, fast, multi-language code statistics in your terminal.

`tally` scans a folder, respects `.gitignore`, and reports lines, characters, functions, classes, variables, and cyclomatic complexity across 25+ languages — via real tree-sitter parsing, not regex guesses.

It runs as a one-shot CLI when you give it a path, or a full interactive TUI with a folder picker when you don't.

## Install

```sh
pnpm dlx @zachlagden/tally ./some-folder
# or
npm install -g @zachlagden/tally
tally ./some-folder
```

Requires Node 20+.

## Quick start

```sh
tally                       # interactive: folder picker → scan → results TUI
tally .                     # static one-shot summary of the current folder
tally ./src                 # scan a subdirectory
tally . --json              # machine-readable JSON to stdout
tally . --csv               # per-language CSV
tally . --no-symbols        # lines only, skip tree-sitter (fastest mode)
tally . -i                  # force interactive TUI even with a path
```

## What it counts

Per language and per file:

- **Lines** — total, blank, comment, code (per-language comment syntax)
- **Characters** and **bytes**
- **Functions, classes, variables** — via tree-sitter for accuracy, regex fallback for long-tail languages
- **Cyclomatic complexity** — derived from `if/for/while/case/catch` branch nodes

Plus across the whole repo:

- **Top-N largest files** by code lines
- **Top-N most complex files** by complexity
- **Git insights** — contributor count, top contributor, repo age, commit count (when `.git` exists)

## Languages

Tree-sitter (full symbol parsing): TypeScript, TSX, JavaScript, Python, Go, Rust, Java, C, C++, C#, Ruby, PHP, Swift, Kotlin, Scala, Dart, Lua, Elixir, OCaml, Elm, Zig, Solidity, Vue, Bash.

Regex fallback (functions / classes / variables): Haskell, SQL, R, Perl, SCSS.

Lines-only (data / markup formats): JSON, YAML, TOML, HTML, CSS, Markdown, Dockerfile, Makefile.

## Flags

| Flag                | Description                                                       |
| ------------------- | ----------------------------------------------------------------- |
| `-i, --interactive` | Force interactive TUI even when a path is given                   |
| `--json`            | Emit JSON to stdout (no ANSI)                                     |
| `--csv`             | Emit CSV per-language rows to stdout                              |
| `--no-symbols`      | Skip tree-sitter parsing — lines only, much faster                |
| `--no-git`          | Skip git insights even when `.git` exists                         |
| `--top <n>`         | Top-N count for largest / most-complex panels (default 10)        |
| `--lang <ids>`      | Comma-separated language ids to restrict to (e.g. `--lang javascript,typescript`) |
| `--threads <n>`     | Worker threads for parsing. `0` runs single-threaded. Default: picked from repo size and CPU count |
| `--version`         | Print version                                                     |

## Interactive TUI keybindings

| Key                 | Action                                          |
| ------------------- | ----------------------------------------------- |
| `↑ ↓` / `j k`       | Move cursor                                     |
| `enter` / `→` / `l` | Drill into the selected language (or pick path) |
| `← ` / `h` / `esc`  | Back                                            |
| `s`                 | Cycle sort column                               |
| `r`                 | Reverse sort                                    |
| `g` / `G`           | Jump to top / bottom                            |
| `q`                 | Quit                                            |

## How it scans

1. If the target is a git repo, `tally` shells out to `git ls-files -co --exclude-standard -z` for native-speed gitignore handling.
2. Otherwise it walks with [`tinyglobby`](https://github.com/SuperchupuDev/tinyglobby), gitignore-aware.
3. Binary files, lockfiles, minified bundles, `node_modules`, `dist`, `.git`, common cache dirs are skipped.
4. Each file is read in parallel (`p-limit` at `cpus × 2`).
5. Symbol parsing uses [`web-tree-sitter`](https://www.npmjs.com/package/web-tree-sitter) with WASM grammars from [`tree-sitter-wasms`](https://www.npmjs.com/package/tree-sitter-wasms) — no native compilation at install time. Files over 1 MB skip symbol parsing and are marked `symbolsSkipped` in JSON output. Large repos are parsed across worker threads; small ones run in-process to avoid thread start-up cost.

Typical performance on a modern laptop:

| Repo                                | Files | LOC   | Warm scan |
| ----------------------------------- | ----- | ----- | --------- |
| Small (this repo)                   | ~20   | ~4k   | ~50 ms    |
| Medium (54-file TypeScript project) | 54    | 11k   | ~300 ms   |
| Large (934-file polyglot monorepo)  | 934   | 273k  | ~5 s      |

## License

MIT
