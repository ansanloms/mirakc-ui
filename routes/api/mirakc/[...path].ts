import { Handler, Handlers } from "$fresh/server.ts";

const proxy: Handler = async (req) => {
  const mirakcApiUrl = new URL(Deno.env.get("MIRAKC_API_URL") || "");

  const proxyUrl = new URL(req.url);
  proxyUrl.host = mirakcApiUrl.host;
  proxyUrl.pathname = proxyUrl.pathname.replace(
    /^(\/api\/mirakc)/,
    mirakcApiUrl.pathname,
  );

  const proxyReq = new Request(proxyUrl, {
    method: req.method,
    headers: req.headers,
    body: req.body,
    mode: req.mode,
    credentials: req.credentials,
    cache: req.cache,
    redirect: req.redirect,
    referrer: req.referrer,
    referrerPolicy: req.referrerPolicy,
    integrity: req.integrity,
    keepalive: req.keepalive,
    signal: req.signal,
  });

  const response = await fetch(proxyReq);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
};

export const handler: Handlers = {
  GET: proxy,
  HEAD: proxy,
  POST: proxy,
  PUT: proxy,
  DELETE: proxy,
  OPTIONS: proxy,
  PATCH: proxy,
};
