import { defineConfig } from "tsup";

export default defineConfig({
  entry: { cli: "src/cli.ts", worker: "src/scan/worker.ts" },
  format: ["esm"],
  target: "node22",
  outDir: "dist",
  clean: true,
  minify: false,
  sourcemap: true,
  splitting: true,
  shims: false,
  dts: false,
  external: ["web-tree-sitter", "tree-sitter-wasms"],
  banner: { js: "#!/usr/bin/env node" },
  esbuildOptions(options) {
    options.jsx = "automatic";
    options.jsxImportSource = "react";
  },
});
