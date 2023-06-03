import { useEffect, useState } from "preact/hooks";
import createClient from "openapi-fetch";
import type {
  FetchOptions,
  FetchResponse,
  FilterKeys,
  HttpMethod,
  PathItemObject,
  PathsWith,
} from "openapi-fetch";

type ClientOptions = Parameters<typeof createClient>[0];

const State = {
  /**
   * 処理開始前。
   */
  before: "before",

  /**
   * 処理中。
   */
  pending: "pending",

  /**
   * 成功。
   */
  fulfilled: "fulfilled",

  /**
   * 失敗。
   */
  rejected: "rejected",
} as const;

type StateType = (typeof State)[keyof typeof State];

function useQuery<
  Paths extends Record<string, PathItemObject>,
  M extends HttpMethod,
  P extends PathsWith<Paths, M>,
>(
  clientOptions: ClientOptions,
  method: HttpMethod,
  url: P,
  init?: FetchOptions<FilterKeys<Paths[P], M>>,
) {
  type ResponseType = FetchResponse<
    M extends keyof Paths[P] ? Paths[P][keyof Paths[P] & M] : unknown
  >;

  const client = createClient<Paths>(clientOptions);

  const [state, setState] = useState<StateType>(
    State.before,
  );

  const [data, setData] = useState<ResponseType["data"] | undefined>(
    undefined,
  );

  const [error, setError] = useState<ResponseType["error"] | undefined>(
    undefined,
  );

  const mutate = async (
    init: FetchOptions<FilterKeys<Paths[P], M>>,
  ): Promise<ResponseType> => {
    setState(State.pending);
    setData(undefined);
    setError(undefined);

    const execute: keyof typeof client = method === "delete" ? "del" : method;
    const response: ResponseType = await client[execute]<P>(url, init);

    if (response.response.ok) {
      setState(State.fulfilled);
      setData(response.data);
      setError(undefined);
    } else {
      setState(State.rejected);
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

  return { state, data, error, loading: state === State.pending, mutate };
}

export function useGet<
  Paths extends Record<string, PathItemObject>,
  P extends PathsWith<Paths, "get">,
>(
  clientOptions: ClientOptions,
  url: P,
  init?: FetchOptions<FilterKeys<Paths[P], "get">>,
) {
  return useQuery(clientOptions, "get", url, init);
}

export function usePost<
  Paths extends Record<string, PathItemObject>,
  P extends PathsWith<Paths, "post">,
>(
  clientOptions: ClientOptions,
  url: P,
  init?: FetchOptions<FilterKeys<Paths[P], "post">>,
) {
  return useQuery(clientOptions, "post", url, init);
}

export function useDelete<
  Paths extends Record<string, PathItemObject>,
  P extends PathsWith<Paths, "delete">,
>(
  clientOptions: ClientOptions,
  url: P,
  init?: FetchOptions<FilterKeys<Paths[P], "delete">>,
) {
  return useQuery(clientOptions, "delete", url, init);
}
