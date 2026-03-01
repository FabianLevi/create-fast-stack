import { defineConfig } from "tsdown";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: "esm",
  target: "node18",
  clean: true,
  banner: { js: "#!/usr/bin/env node" },
});
