import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const grammarsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "grammars");
const manifest = JSON.parse(readFileSync(join(grammarsDir, "manifest.json"), "utf8"));
const only = new Set(process.argv.slice(2));
const work = mkdtempSync(join(tmpdir(), "tally-grammars-"));
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

function unpack(spec) {
  const dest = join(work, spec.replace(/[@/]/g, "_"));
  if (existsSync(dest)) return join(dest, "package");
  mkdirSync(dest, { recursive: true });
  const tarball = execFileSync(npm, ["pack", spec, "--silent", "--pack-destination", dest], { encoding: "utf8" }).trim().split("\n").pop();
  execFileSync("tar", ["-xzf", join(dest, tarball), "-C", dest]);
  return join(dest, "package");
}

function licenseText(pkgDir) {
  const file = readdirSync(pkgDir).find((name) => /^licen[cs]e/i.test(name));
  return file ? readFileSync(join(pkgDir, file), "utf8").trim() : undefined;
}

const licenses = new Map();
try {
  for (const entry of manifest.grammars) {
    const target = join(grammarsDir, `tree-sitter-${entry.grammar}.wasm`);
    const spec = `${entry.package}@${entry.version}`;
    const pkgDir = unpack(spec);
    const meta = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
    licenses.set(spec, { license: meta.license, text: licenseText(pkgDir) });
    if (only.size > 0 && !only.has(entry.grammar)) continue;
    if (entry.build) {
      execFileSync(npx, ["-y", `tree-sitter-cli@${manifest.treeSitterCli}`, "build", "--wasm", "-o", target, "."], {
        cwd: pkgDir,
        stdio: ["ignore", "ignore", "inherit"],
      });
    } else {
      copyFileSync(join(pkgDir, entry.wasm), target);
    }
    console.log(`${entry.grammar.padEnd(11)} ${spec}${entry.build ? " (built)" : ""}`);
  }

  const sections = [...licenses].map(([spec, { license, text }]) =>
    `## ${spec}\n\nLicense: ${license}\n\n${text ? "```\n" + text + "\n```" : "No licence file shipped in the package."}`,
  );
  writeFileSync(
    join(grammarsDir, "LICENSES.md"),
    `# Grammar licences\n\nThe WebAssembly grammars in this folder are built from these packages. ` +
      `Regenerate the folder with \`node scripts/update-grammars.mjs\`.\n\n${sections.join("\n\n")}\n`,
  );
} finally {
  rmSync(work, { recursive: true, force: true });
}
