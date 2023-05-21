import { useEffect, useState } from "preact/hooks";
import createClient from "openapi-fetch";
import type {
  FetchOptions,
  FetchResponse,
  FilterKeys,
  HttpMethod,
  PathsWith,
} from "openapi-fetch";
import type { paths } from "./schema.ts";

const client = createClient<paths>({
  baseUrl: "/api",
});

function useQuery<M extends HttpMethod, P extends PathsWith<paths, M>>(
  method: HttpMethod,
  url: P,
  init?: FetchOptions<FilterKeys<paths[P], M>>,
) {
  const [state, setState] = useState<"init" | "loading" | "success" | "error">(
    "init",
  );

  const [data, setData] = useState<
    | FetchResponse<
      M extends keyof paths[P] ? paths[P][keyof paths[P] & M] : unknown
    >["data"]
    | undefined
  >(undefined);

  const [error, setError] = useState<
    | FetchResponse<
      M extends keyof paths[P] ? paths[P][keyof paths[P] & M] : unknown
    >["error"]
    | undefined
  >(undefined);

  const mutate = async (init: FetchOptions<FilterKeys<paths[P], M>>) => {
    setState("loading");
    setData(undefined);
    setError(undefined);

    const execute: keyof typeof client = method === "delete" ? "del" : method;
    const response = await client[execute]<P>(url, init);

    if (response.response.ok) {
      setState("success");
      setData(response.data);
      setError(undefined);
    } else {
      setState("error");
      setData(undefined);
      setError(response.error);
    }

    return response;
  };

  useEffect(() => {
    if (typeof init !== "undefined") {
      mutate(init);
    }
  }, []);

  return { state, data, error, loading: state === "loading", mutate };
}

export function useGet<P extends PathsWith<paths, "get">>(
  url: P,
  init?: FetchOptions<FilterKeys<paths[P], "get">>,
) {
  return useQuery("get", url, init);
}

export function usePost<P extends PathsWith<paths, "post">>(
  url: P,
  init?: FetchOptions<FilterKeys<paths[P], "post">>,
) {
  return useQuery("post", url, init);
}

export function useDelete<P extends PathsWith<paths, "delete">>(
  url: P,
  init?: FetchOptions<FilterKeys<paths[P], "delete">>,
) {
  return useQuery("delete", url, init);
}
