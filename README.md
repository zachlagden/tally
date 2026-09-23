# tally

<div align="center">

![CI](https://img.shields.io/github/actions/workflow/status/zachlagden/tally/ci.yml?branch=main&style=flat-square&label=ci)
![License](https://img.shields.io/github/license/zachlagden/tally?style=flat-square)
![Node](https://img.shields.io/badge/node-%3E%3D22-339933?style=flat-square&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-strict-3178c6?style=flat-square&logo=typescript&logoColor=white)
![Languages](https://img.shields.io/badge/languages-37-blueviolet?style=flat-square)
![Stars](https://img.shields.io/github/stars/zachlagden/tally?style=flat-square)

**Code statistics for your terminal. Lines, comments, functions, classes and
complexity across 37 languages, counted from a real parse.**

[Features](#features) • [Installation](#installation) • [Usage](#usage) •
[Languages](#languages) • [Performance](#performance) • [FAQ](#faq)

<br />

<img src="docs/screenshot.svg" alt="tally scanning its own repository: a language breakdown with bars, the largest and most complex files, and a git summary" width="705" />

</div>

## What does this tool do?

1. **Lists** the files in a folder. Inside a git repo it asks `git ls-files`, so `.gitignore` is respected.
2. **Skips** what isn't source: binaries, lockfiles, minified bundles, `node_modules`, `dist`, caches and virtualenvs.
3. **Classifies** each file by extension, filename (`Dockerfile`, `Makefile`) or shebang line.
4. **Counts** total, code, comment and blank lines using each language's comment syntax.
5. **Parses** source with [tree-sitter](https://tree-sitter.github.io/) to count functions, classes, variables and branches.
6. **Reports** a per-language breakdown, the largest and most complex files, and git history, as a terminal summary, an interactive TUI, JSON or CSV.

## Features

- **Symbol counts from a parser.** Functions, classes and variables come from tree-sitter syntax trees, not line-matching regexes. A handful of long-tail languages use regex fallbacks.
- **Interactive TUI.** Run `tally` with no arguments to pick a folder, then browse languages and files, drill in, and re-sort by any column.
- **JSON and CSV output** for scripts, dashboards and CI.
- **Parallel parsing.** Large repos are parsed on a pool of worker threads. Small ones stay on one thread, where thread start-up would cost more than it saves.
- **Git insights.** Contributor count, top contributor, repo age and commit count, all read from `HEAD`.
- **No native build.** Grammars ship as WebAssembly, so installing needs no compiler toolchain.
- **Nothing hidden.** Files that exist but can't be read are listed in the JSON output and counted in the summary.

## Installation

Requires [Node.js](https://nodejs.org/) 22 or newer and [pnpm](https://pnpm.io/).

tally isn't on npm yet. Install it from source:

```bash
git clone https://github.com/zachlagden/tally
cd tally
pnpm install
pnpm build
pnpm link --global
```

`pnpm link --global` points the `tally` command at your clone. If you move the folder, run it again from the new location.

## Usage

```bash
tally                  # interactive: pick a folder, then browse the results
tally .                # one-shot summary of the current folder
tally ./src            # scan a subfolder (inside a repo, .gitignore still applies)
tally . --json         # JSON to stdout, no colour codes
tally . --csv          # one CSV row per language
tally . --no-symbols   # line counts only, skips parsing
tally . -i             # interactive TUI for a given path
```

### Options

| Option | Description |
| --- | --- |
| `-i, --interactive` | Open the interactive TUI even when a path is given |
| `--json` | Print JSON to stdout |
| `--csv` | Print per-language CSV to stdout |
| `--no-symbols` | Count lines only and skip tree-sitter parsing |
| `--no-git` | Skip git insights |
| `--top <n>` | Rows in the largest and most complex file lists (default 10) |
| `--lang <ids>` | Only count these languages, e.g. `--lang typescript,tsx`. An unknown id prints the valid ones |
| `--threads <n>` | Worker threads for parsing. `0` runs on one thread. The default depends on repo size and CPU count |
| `-V, --version` | Print the version |

### Interactive TUI keys

| Key | Action |
| --- | --- |
| `↑` `↓` / `j` `k` | Move |
| `enter` / `→` / `l` | Open the selected language, or pick the folder |
| `←` / `h` / `esc` | Back |
| `s` | Cycle the sort column |
| `r` | Reverse the sort |
| `g` / `G` | Jump to top / bottom |
| `q` | Quit |

### JSON output

Run on this repo, `--json` prints totals, one entry per language, the largest and most complex files, any files that couldn't be read, and git insights:

```json
{
  "fileCount": 42,
  "totalLines": 3437,
  "languages": [
    { "id": "typescript", "files": 29, "codeLines": 2076, "commentLines": 1, "functions": 151, "classes": 18, "complexity": 314 }
  ],
  "largestFiles": [{ "path": "src/languages.ts", "codeLines": 397, "functions": 4 }],
  "skippedFiles": [],
  "git": { "contributors": 1, "commitCount": 10, "firstCommitDate": "2026-05-20T12:09:59+01:00" }
}
```

Fields are trimmed here. Files over 1 MB are still line-counted but skip symbol parsing, and carry `"symbolsSkipped": true`.

## Languages

**Parsed with tree-sitter** (functions, classes, variables, complexity):
TypeScript, TSX, JavaScript, Python, Go, Rust, Java, C, C++, C#, Ruby, PHP, Swift, Kotlin, Scala, Lua, Elixir, OCaml, Solidity, Zig, Shell, and Vue (its `<script>` block, with the JavaScript or TypeScript grammar).

**Parsed with regex fallbacks:** Haskell, SQL, R, Perl, SCSS.

**Line counts only:** JSON, YAML, TOML, HTML, CSS, Markdown, Dockerfile, Makefile.

**Line counts now, symbols in progress:** Dart and Elm. Their grammars need a newer tree-sitter runtime than the one bundled, so their symbol counts read zero.

Every language has a fixture in [`test/fixtures/languages`](test/fixtures/languages) with hand-checked line and symbol counts, and CI fails if any of them drift.

Complexity is a cyclomatic-style score: one per function plus one per branch (`if`, loops, `case`, `catch`, ternaries).

## Performance

Measured on an Intel i7-10750H (6 cores) under WSL2 with Node 22, `--json --no-git`:

| Repository | Files | Time |
| --- | --: | --: |
| tally itself | 42 | about 0.3 s |
| [ppy/osu](https://github.com/ppy/osu), 591k lines of C# | 4,968 | 3.5 to 4 s |
| ppy/osu with `--no-symbols` | 4,968 | 1.4 s |

Nearly all of the osu time is tree-sitter parsing 23 MB of C#. `tally --version` starts in about 70 ms because the TUI libraries only load when something is drawn.

## How it works

1. Inside a git repo, files come from `git ls-files -co --exclude-standard`. Elsewhere, [tinyglobby](https://github.com/SuperchupuDev/tinyglobby) walks the tree, and ignored directories are filtered by name.
2. Files are sorted by language and handed out in batches, so each worker thread loads only the grammars it needs.
3. Each worker reads a file, counts its lines, and runs a tree-sitter query that tags functions, classes, variables and branches.
4. The main thread aggregates the results while `git shortlog` and `git rev-list` run in parallel.
5. V8 runs the WebAssembly grammars with its baseline compiler (`--liftoff-only`). A short-lived CLI never wins back the time the optimising compiler spends on grammars this size.

## FAQ

<details>
<summary><b>How is this different from cloc or tokei?</b></summary>

cloc and tokei count lines: code, comments and blanks. tally counts those too, then parses each file to count functions, classes and variables and to score complexity. It also has an interactive TUI and lists the largest and most complex files. If you only want line counts, `--no-symbols` skips the parse.
</details>

<details>
<summary><b>Why is a file missing from the results?</b></summary>

- It's ignored by `.gitignore`, or it lives in a skipped directory such as `node_modules`, `dist`, `vendor` or `.venv`.
- It's a lockfile (`pnpm-lock.yaml`, `package-lock.json`, `Cargo.lock`, `go.sum` and others).
- It's binary or minified, or its extension isn't one tally knows.
- It couldn't be read. Check `skippedFiles` in `--json` output for the reason.
</details>

<details>
<summary><b>Why do some languages show no functions?</b></summary>

Data and markup formats have none to count. Dart and Elm should, and are listed under [Languages](#languages) as in progress.
</details>

<details>
<summary><b>Can I use it in CI?</b></summary>

Yes. `tally . --json` prints no colour codes and exits cleanly when piped into `head` or `jq`. Add `--no-git` on shallow clones, where commit counts are incomplete.
</details>

## Development

```bash
pnpm install
pnpm dev          # rebuild on save and run
pnpm test         # build, then run the test suite
pnpm typecheck
```

The CLI tests run against `dist/`, so `pnpm test` builds first.

### Testing

- **Unit and CLI tests** run on Linux, macOS and Windows against Node 22 and 24.
- **Language fixtures.** One small program per supported language, with every line tagged by hand as code, comment or blank, and the expected function, class and variable counts. Known gaps are marked with `test.fails`, so fixing one turns the suite red until the marker is removed.
- **Smoke tests** run tally on pinned releases of Flask, Express, Gin, ripgrep, Gson and Sinatra. Each checks the top language, that symbols were found, that nothing was skipped, and that single-threaded and worker-pool runs produce identical JSON.

Run a smoke test locally with `node scripts/smoke.mjs <repo-dir> <language-id>` after `pnpm build`.

## Star history

<a href="https://github.com/zachlagden/tally/stargazers">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://repo-star-history.zachlagden.uk/svg?repos=zachlagden/tally&type=Date&theme=dark&legend=top-left&format=png" />
   <source media="(prefers-color-scheme: light)" srcset="https://repo-star-history.zachlagden.uk/svg?repos=zachlagden/tally&type=Date&legend=top-left&format=png" />
   <img alt="Star history chart for zachlagden/tally" src="https://repo-star-history.zachlagden.uk/svg?repos=zachlagden/tally&type=Date&legend=top-left&format=png" />
 </picture>
</a>

## License

MIT License. See [LICENSE](LICENSE) for details.
