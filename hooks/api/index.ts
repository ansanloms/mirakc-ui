import * as api from "./use.ts";
import createClient from "openapi-fetch";
import type { FetchOptions } from "openapi-fetch";
import type { FilterKeys, PathsWithMethod } from "openapi-typescript-helpers";
import type { paths } from "./schema.d.ts";

const baseUrl = "/api/mirakc";

export function useGet<
  P extends PathsWithMethod<paths, "get">,
>(
  url: P,
  init?: FetchOptions<FilterKeys<paths[P], "get">>,
) {
  return api.useGet<paths, P>({ baseUrl }, url, init);
}

export function usePost<
  P extends PathsWithMethod<paths, "post">,
>(
  url: P,
  init?: FetchOptions<FilterKeys<paths[P], "post">>,
) {
  return api.usePost<paths, P>({ baseUrl }, url, init);
}

export function useDelete<
  P extends PathsWithMethod<paths, "delete">,
>(
  url: P,
  init?: FetchOptions<FilterKeys<paths[P], "delete">>,
) {
  return api.useDelete<paths, P>({ baseUrl }, url, init);
}
