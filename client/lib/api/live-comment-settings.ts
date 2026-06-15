/**
 * 実況連携設定 API (/api/live-comment-settings) のクライアント。
 *
 * このエンドポイントは mirakc ではなく mirakc-ui 自身の Hono が提供するため、
 * mirakc の OpenAPI から生成する $api (openapi-react-query) には含まれない。
 * 素の fetch を薄くラップする。型は docs/api の OpenAPI から
 * `deno task generate:internal` で生成した JSON Schema 定数
 * (server/lib/api/internal-schemas.ts) を単一ソースとし、server と同じく
 * json-schema-to-ts の FromSchema で導出する (keyword-rules クライアントと同形)。
 */
import type { FromSchema } from "json-schema-to-ts";
import type { internalSchemas } from "../../../server/lib/api/internal-schemas.ts";

export type LiveCommentAssignment = FromSchema<
  typeof internalSchemas["LiveCommentAssignment"]
>;
export type LiveCommentMapping = FromSchema<
  typeof internalSchemas["LiveCommentMapping"]
>;
export type LiveCommentMappingInput = FromSchema<
  typeof internalSchemas["LiveCommentMappingInput"]
>;
export type LiveCommentSuggestion = FromSchema<
  typeof internalSchemas["LiveCommentSuggestion"]
>;

const BASE_PATH = "/api/live-comment-settings";

async function ensureOk(res: Response): Promise<Response> {
  if (!res.ok) {
    await res.body?.cancel();
    throw new Error(`live-comment-settings api failed: ${res.status}`);
  }
  return res;
}

/** 割り当て一覧を取得する。 */
export async function fetchLiveCommentMappings(
  fetchFn: typeof fetch = fetch,
): Promise<LiveCommentMapping[]> {
  const res = await ensureOk(await fetchFn(BASE_PATH));
  return await res.json();
}

/** 自動補完候補 (組み込み対照表から導出) を取得する。 */
export async function fetchLiveCommentSuggestions(
  fetchFn: typeof fetch = fetch,
): Promise<LiveCommentSuggestion[]> {
  const res = await ensureOk(await fetchFn(`${BASE_PATH}/suggestions`));
  return await res.json();
}

/** 割り当てを追加する。 */
export async function addLiveCommentMapping(
  input: LiveCommentMappingInput,
  fetchFn: typeof fetch = fetch,
): Promise<LiveCommentMapping> {
  const res = await ensureOk(
    await fetchFn(BASE_PATH, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
  return await res.json();
}

/** 割り当てを更新する (全項目上書き)。 */
export async function updateLiveCommentMapping(
  id: string,
  input: LiveCommentMappingInput,
  fetchFn: typeof fetch = fetch,
): Promise<LiveCommentMapping> {
  const res = await ensureOk(
    await fetchFn(`${BASE_PATH}/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
  return await res.json();
}

/** 割り当てを削除する。 */
export async function removeLiveCommentMapping(
  id: string,
  fetchFn: typeof fetch = fetch,
): Promise<void> {
  const res = await ensureOk(
    await fetchFn(`${BASE_PATH}/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
  );
  await res.body?.cancel();
}
