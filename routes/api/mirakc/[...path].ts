import { define } from "../../../utils.ts";

const proxy = async (ctx: Parameters<Parameters<typeof define.handlers>[0]["GET"]>[0]) => {
  const proxyUrl = new URL(Deno.env.get("MIRAKC_API_URL") || "");

  proxyUrl.pathname = ctx.url.pathname
    .replace(
      new RegExp(
        `^(${
          Deno.env.get("BASE_PATH")?.replace("/", "\\/") || ""
        }\\/api\\/mirakc)`,
        "i",
      ),
      proxyUrl.pathname,
    );

  const response = await fetch(new Request(proxyUrl, ctx.req));

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
};

export const handler = define.handlers({
  GET: proxy,
  POST: proxy,
  PUT: proxy,
  DELETE: proxy,
  PATCH: proxy,
});
