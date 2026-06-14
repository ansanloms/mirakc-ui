/**
 * キーワード自動録画ルール API (/api/keyword-rules) のクライアント。
 *
 * このエンドポイントは mirakc ではなく mirakc-ui 自身の Hono が提供するため、
 * mirakc の OpenAPI から生成する $api (openapi-react-query) には含まれない。
 * 素の fetch を薄くラップする。型は docs/api の OpenAPI から
 * `deno task generate:internal` で生成した internal-schema.d.ts を単一ソースと
 * する (mirakc 側の schema.d.ts と同じ扱い)。
 */
import type { components } from "./internal-schema.d.ts";

export type KeywordRule = components["schemas"]["KeywordRule"];
export type KeywordRuleInput = components["schemas"]["KeywordRuleInput"];

const BASE_PATH = "/api/keyword-rules";

async function ensureOk(res: Response): Promise<Response> {
  if (!res.ok) {
    await res.body?.cancel();
    throw new Error(`keyword-rules api failed: ${res.status}`);
  }
  return res;
}

/** ルール一覧を取得する。 */
export async function fetchKeywordRules(
  fetchFn: typeof fetch = fetch,
): Promise<KeywordRule[]> {
  const res = await ensureOk(await fetchFn(BASE_PATH));
  return await res.json();
}

/** ルールを追加する。 */
export async function addKeywordRule(
  input: KeywordRuleInput,
  fetchFn: typeof fetch = fetch,
): Promise<KeywordRule> {
  const res = await ensureOk(
    await fetchFn(BASE_PATH, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
  return await res.json();
}

/** ルールを更新する (有効/停止トグル含む全項目上書き)。 */
export async function updateKeywordRule(
  id: string,
  input: KeywordRuleInput,
  fetchFn: typeof fetch = fetch,
): Promise<KeywordRule> {
  const res = await ensureOk(
    await fetchFn(`${BASE_PATH}/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
  return await res.json();
}

/** ルールを削除する。 */
export async function removeKeywordRule(
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
