import { Hono } from "hono";
import { mirakcApiUrlOf } from "../lib/mirakc.ts";

const mirakcUrl = Deno.env.get("MIRAKC_URL");

/**
 * mirakc バックエンドへのプロキシ。`/api/mirakc/*` を `MIRAKC_URL` の
 * Web API (`${MIRAKC_URL}/api`) 配下へそのまま転送する。CORS 回避のため
 * サーバサイドプロキシとして機能する。
 *
 * 旧構成の routes/api/mirakc/[...path].ts と等価。`app.route("/api/mirakc", mirakc)`
 * でマウントするため、ここでのパスは `/*` がサブパスに対応する。
 */
export const mirakc = new Hono();

mirakc.all("/*", async (c) => {
  if (!mirakcUrl) {
    return c.json({ error: "MIRAKC_URL is not set" }, 500);
  }

  // マウントポイント (/api/mirakc) を除いたサブパス + クエリを上流 URL に連結する。
  const url = new URL(c.req.url);
  const subPath = url.pathname.replace(/^\/api\/mirakc/, "");
  const target = mirakcApiUrlOf(mirakcUrl) + subPath + url.search;

  const res = await fetch(target, {
    method: c.req.method,
    headers: c.req.raw.headers,
    body: c.req.method === "GET" || c.req.method === "HEAD"
      ? undefined
      : c.req.raw.body,
  });

  return new Response(res.body, {
    status: res.status,
    headers: res.headers,
  });
});
