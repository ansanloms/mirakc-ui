import { Handler, Handlers } from "$fresh/server.ts";

const proxy: Handler = async (req) => {
  const proxyUrl = new URL(Deno.env.get("MIRAKC_API_URL") || "");
  proxyUrl.pathname = (new URL(req.url)).pathname.replace(
    /^(\/api\/mirakc)/,
    proxyUrl.pathname,
  );

  const response = await fetch(new Request(proxyUrl, req));

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
