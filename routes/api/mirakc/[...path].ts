import { Handler, Handlers } from "$fresh/server.ts";

const proxy: Handler = async (request) => {
  const proxyUrl = new URL(Deno.env.get("MIRAKC_API_URL") || "");

  proxyUrl.pathname = new URL(request.url).pathname
    .replace(
      new RegExp(
        `^(${
          Deno.env.get("BASE_PATH")?.replace("/", "\/") || ""
        }\/api\/mirakc)`,
        "i",
      ),
      proxyUrl.pathname,
    );

  const response = await fetch(new Request(proxyUrl, request));

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
