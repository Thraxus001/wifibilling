import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";

// `npm run build:router` makes a flat folder (dist-router/) you upload into the MikroTik's
// hotspot directory. index.html becomes login.html and receives the hotspot variables.
function mikrotik(): Plugin {
  let outDir = "";
  return {
    name: "mikrotik-hotspot",
    configResolved(c) { outDir = path.resolve(c.root, c.build.outDir); },
    transformIndexHtml: () => [{
      tag: "script",
      injectTo: "head-prepend",
      // The router replaces $(...) when it serves login.html
      children: 'window.__HOTSPOT__={mac:"$(mac)",ip:"$(ip)",loginUrl:"$(link-login-only)",origUrl:"$(link-orig)"};',
    }],
    closeBundle() { fs.renameSync(path.join(outDir, "index.html"), path.join(outDir, "login.html")); },
  };
}

export default defineConfig(({ mode }) => {
  const router = mode === "router";
  return {
    base: router ? "./" : "/",
    plugins: [react(), ...(router ? [mikrotik()] : [])],
    server: { proxy: { "/api": "http://localhost:8000" } },
    build: router
      ? {
          outDir: "dist-router",
          assetsDir: "", // no sub-folders to create on the router
          rollupOptions: { output: { entryFileNames: "portal.js", chunkFileNames: "[name].js", assetFileNames: "[name][extname]" } },
        }
      : {},
  };
});
