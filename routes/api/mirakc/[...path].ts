import type { FreshContext } from "fresh";

const proxy = async (ctx: FreshContext) => {
  const proxyUrl = new URL(Deno.env.get("MIRAKC_API_URL") ?? "");

  proxyUrl.pathname = ctx.url.pathname
    .replace(/^\/api\/mirakc/, proxyUrl.pathname);

  const response = await fetch(new Request(proxyUrl, ctx.req));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
};

export const handler = {
  GET: proxy,
  POST: proxy,
  PUT: proxy,
  DELETE: proxy,
  PATCH: proxy,
};
