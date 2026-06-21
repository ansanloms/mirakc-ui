import { Hono } from "hono";
import type { FromSchema } from "json-schema-to-ts";
import type { internalSchemas } from "../lib/api/internal-schemas.ts";

/**
 * アプリサーバの実行時設定。docs/api の OpenAPI (AppConfig) を単一ソースに
 * 型を導出する。クライアントは起動時にこれを取得し、日時表示のタイムゾーンを
 * サーバ側 (TZ 環境変数) に揃える。
 */
export type AppConfig = FromSchema<typeof internalSchemas["AppConfig"]>;

/**
 * アプリサーバの実行時設定 API。`/api/config` にマウントする。
 *
 * - GET / 設定 (現状はクライアントの日時表示に使う timeZone のみ)
 *
 * timeZone は呼び出し側 (main.ts) が TZ 環境変数から 1 度だけ解決して注入する。
 * サーバ自身の通知・ファイル名の整形と同じ値を使い、表示タイムゾーンを単一の
 * ソースに揃える。
 */
export function createConfigRoutes(config: AppConfig): Hono {
  const app = new Hono();

  app.get("/", (c) => {
    return c.json<AppConfig>(config);
  });

  return app;
}
