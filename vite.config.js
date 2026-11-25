import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: resolve(projectRoot, "src"),
  base: "./",
  build: {
    outDir: resolve(projectRoot, "dist"),
    emptyOutDir: true
  }
});
