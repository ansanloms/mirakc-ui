/**
 * ntfy 通知設定の Deno KV 永続化。
 *
 * keyword-rules-store.ts と同じ KV ファイル (KV_PATH) を使い、キーは
 * `["settings", "notification"]` の単一値。同一 SQLite を複数の Deno.openKv
 * で開く形になるが、書き込みは設定保存時のみで競合しない。設定系 store が
 * さらに増えるなら共有 opener (server/lib/kv.ts) への切り出しを検討する。
 */

import {
  DEFAULT_NOTIFICATION_SETTINGS,
  isNotificationSettings,
  type NotificationSettings,
} from "./notification-settings.ts";
import { KV_PATH } from "./keyword-rules-store.ts";

const KEY = ["settings", "notification"] as const;

/** ntfy 通知設定の Deno KV ストア。 */
export class NotificationSettingsStore {
  #path: string;
  #kv: Promise<Deno.Kv> | null = null;

  /** path はテスト用に差し替え可能 (`":memory:"` など)。既定は KV_PATH。 */
  constructor(path: string = KV_PATH) {
    this.#path = path;
  }

  #open(): Promise<Deno.Kv> {
    if (this.#kv === null) {
      this.#kv = (async () => {
        // SQLite ファイルの親ディレクトリが無いと openKv が失敗する。
        const dir = this.#path.replace(/\/[^/]*$/, "");
        if (dir !== "" && dir !== this.#path) {
          await Deno.mkdir(dir, { recursive: true });
        }
        return await Deno.openKv(this.#path);
      })();
    }
    return this.#kv;
  }

  /** 保存済み設定。未保存・不正値なら既定値 (通知無効) を返す。 */
  async get(): Promise<NotificationSettings> {
    const kv = await this.#open();
    const entry = await kv.get([...KEY]);
    return isNotificationSettings(entry.value)
      ? entry.value
      : DEFAULT_NOTIFICATION_SETTINGS;
  }

  /** 設定を全上書きで保存する。 */
  async set(settings: NotificationSettings): Promise<NotificationSettings> {
    const kv = await this.#open();
    await kv.set([...KEY], settings);
    return settings;
  }

  /** KV を閉じる (テスト用)。 */
  async close(): Promise<void> {
    if (this.#kv !== null) {
      (await this.#kv).close();
      this.#kv = null;
    }
  }
}
