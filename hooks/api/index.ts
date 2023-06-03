import * as api from "./use.ts";
import type { FetchOptions, FilterKeys, PathsWith } from "openapi-fetch";
import type { paths } from "./schema.d.ts";

const baseUrl = "/api";

export function useGet<
  P extends PathsWith<paths, "get">,
>(
  url: P,
  init?: FetchOptions<FilterKeys<paths[P], "get">>,
) {
  return api.useGet<paths, P>({ baseUrl }, url, init);
}

export function usePost<
  P extends PathsWith<paths, "post">,
>(
  url: P,
  init?: FetchOptions<FilterKeys<paths[P], "post">>,
) {
  return api.usePost<paths, P>({ baseUrl }, url, init);
}

export function useDelete<
  P extends PathsWith<paths, "delete">,
>(
  url: P,
  init?: FetchOptions<FilterKeys<paths[P], "delete">>,
) {
  return api.useDelete<paths, P>({ baseUrl }, url, init);
}
