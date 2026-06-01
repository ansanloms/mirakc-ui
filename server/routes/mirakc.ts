import { Hono } from "hono";

const mirakcApiUrl = Deno.env.get("MIRAKC_API_URL");

/**
 * mirakc バックエンドへのプロキシ。`/api/mirakc/*` を `MIRAKC_API_URL` 配下へ
 * そのまま転送する。CORS 回避のためサーバサイドプロキシとして機能する。
 *
 * 旧構成の routes/api/mirakc/[...path].ts と等価。`app.route("/api/mirakc", mirakc)`
 * でマウントするため、ここでのパスは `/*` がサブパスに対応する。
 */
export const mirakc = new Hono();

mirakc.all("/*", async (c) => {
  if (!mirakcApiUrl) {
    return c.json({ error: "MIRAKC_API_URL is not set" }, 500);
  }

  // マウントポイント (/api/mirakc) を除いたサブパス + クエリを上流 URL に連結する。
  const url = new URL(c.req.url);
  const subPath = url.pathname.replace(/^\/api\/mirakc/, "");
  const target = mirakcApiUrl.replace(/\/$/, "") + subPath + url.search;

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
