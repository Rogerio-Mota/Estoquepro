import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const resolveFromProject = (...segments) => path.resolve(projectRoot, ...segments);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      react: resolveFromProject("node_modules", "react"),
      "react-dom": resolveFromProject("node_modules", "react-dom"),
      "react/jsx-runtime": resolveFromProject(
        "node_modules",
        "react",
        "jsx-runtime.js",
      ),
      "react/jsx-dev-runtime": resolveFromProject(
        "node_modules",
        "react",
        "jsx-dev-runtime.js",
      ),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: ["react-toastify"],
  },
});
