import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "./schema.d.ts";

/**
 * mirakc API クライアント。Hono サーバの `/api/mirakc` プロキシ経由で叩く
 * (CORS 回避)。openapi-fetch + 生成済み schema.d.ts により型安全。
 */
export const fetchClient = createFetchClient<paths>({
  baseUrl: "/api/mirakc",
});

/**
 * openapi-react-query ラッパー。TanStack Query と openapi の型を統合する。
 *
 * 使い方:
 *   const { data, isPending, error } = $api.useQuery("get", "/services");
 *   const mutation = $api.useMutation("post", "/recording/schedules");
 *
 * 旧 hooks/api の自前 state マシン (before/pending/fulfilled/rejected) は
 * TanStack Query の isPending / isError / data に置き換わり廃止した。
 */
export const $api = createClient(fetchClient);
