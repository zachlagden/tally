import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.tsx"],
  format: ["esm"],
  target: "node20",
  outDir: "dist",
  clean: true,
  minify: false,
  sourcemap: true,
  splitting: false,
  shims: false,
  dts: false,
  external: ["web-tree-sitter", "tree-sitter-wasms"],
  banner: { js: "#!/usr/bin/env node" },
  esbuildOptions(options) {
    options.jsx = "automatic";
    options.jsxImportSource = "react";
  },
});
