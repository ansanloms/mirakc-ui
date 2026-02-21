import * as api from "./use.ts";
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
  init?.baseUrl;
  // deno-lint-ignore no-explicit-any
  return api.useGet<any, P>({ baseUrl }, url, init);
}

export function usePost<
  P extends PathsWithMethod<paths, "post">,
>(
  url: P,
  init?: FetchOptions<FilterKeys<paths[P], "post">>,
) {
  // deno-lint-ignore no-explicit-any
  return api.usePost<any, P>({ baseUrl }, url, init);
}

export function useDelete<
  P extends PathsWithMethod<paths, "delete">,
>(
  url: P,
  init?: FetchOptions<FilterKeys<paths[P], "delete">>,
) {
  // deno-lint-ignore no-explicit-any
  return api.useDelete<any, P>({ baseUrl }, url, init);
}
