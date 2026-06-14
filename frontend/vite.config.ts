import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const resolveFromProject = (...segments) => path.resolve(projectRoot, ...segments);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, projectRoot, "");
  const proxyTarget = (env.DEV_PROXY_TARGET || "http://127.0.0.1:8000").replace(
    /\/$/,
    "",
  );

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": resolveFromProject("src"),
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
    server: {
      allowedHosts: [".trycloudflare.com"],
      proxy: {
        "/api": {
          target: proxyTarget,
          changeOrigin: true,
        },
        "/admin": {
          target: proxyTarget,
          changeOrigin: true,
        },
        "/media": {
          target: proxyTarget,
          changeOrigin: true,
        },
        "/static": {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
