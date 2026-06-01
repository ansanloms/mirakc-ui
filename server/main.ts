import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { mirakc } from "./routes/mirakc.ts";
import { transcode } from "./routes/transcode.ts";

const app = new Hono();

// --- API ---
// mirakc バックエンドへのプロキシ。
app.route("/api/mirakc", mirakc);
// ライブ視聴のトランスコード配信 (mirakc → tsreadex → ffmpeg → MPEG-TS)。
app.route("/api/transcode", transcode);

// --- 静的配信 (本番) ---
// Vite ビルド成果物 (client/dist) を配信する。開発時は Vite dev server が
// UI を担い、/api/* だけがこの Hono にプロキシされるため下記は実質本番専用。
app.use("/*", serveStatic({ root: "./client/dist" }));

// SPA フォールバック: 未知のパスは index.html を返してクライアントルーターに委ねる。
app.get("/*", serveStatic({ path: "./client/dist/index.html" }));

export default app;
