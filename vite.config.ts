import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

const allowedHostsEnv = Deno.env.get("VITE_ALLOWED_HOSTS")?.trim();
const allowedHosts: true | string[] | undefined = allowedHostsEnv
  ? (allowedHostsEnv === "true" || allowedHostsEnv === "all"
    ? true
    : allowedHostsEnv.split(",").map((h) => h.trim()).filter(Boolean))
  : undefined;

// 開発時に Hono(API)を listen するポート。client/server を別プロセスで起動し、
// Vite dev server から /api/* をこのポートへプロキシする。本番は Hono 単体が
// client/dist を serveStatic しつつ同じ /api を提供するため、この proxy は dev 専用。
const apiPort = Deno.env.get("API_PORT") ?? "8000";

export default defineConfig({
  root: "client",
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    allowedHosts,
    proxy: {
      "/api": {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
  plugins: [
    // tanstackRouter は react() より前に置く必要がある。
    // root を "client" にしているため、各パスは root(client) 基準で解決される。
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "./routes",
      generatedRouteTree: "./routeTree.gen.ts",
    }),
    react(),
  ],
});
