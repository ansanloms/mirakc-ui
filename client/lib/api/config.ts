/**
 * アプリサーバの実行時設定 API (/api/config) のクライアント。
 *
 * このエンドポイントは mirakc ではなく mirakc-ui 自身の Hono が提供するため、
 * mirakc の OpenAPI から生成する $api には含まれない。素の fetch を薄くラップする。
 * 型は docs/api の OpenAPI から生成した JSON Schema 定数
 * (server/lib/api/internal-schemas.ts) を単一ソースとし、server と同じく
 * json-schema-to-ts の FromSchema で導出する。
 */
import type { FromSchema } from "json-schema-to-ts";
import type { internalSchemas } from "../../../server/lib/api/internal-schemas.ts";

export type AppConfig = FromSchema<typeof internalSchemas["AppConfig"]>;

const BASE_PATH = "/api/config";

/** アプリサーバの実行時設定を取得する。 */
export async function fetchAppConfig(
  fetchFn: typeof fetch = fetch,
): Promise<AppConfig> {
  const res = await fetchFn(BASE_PATH);
  if (!res.ok) {
    await res.body?.cancel();
    throw new Error(`config api failed: ${res.status}`);
  }
  return await res.json();
}
