/**
 * ntfy 通知設定の永続化。キーは `["settings", "notification"]` の単一値。
 * KV の接続・基本操作は server/store/kv.ts に委ねる。
 */

import {
  DEFAULT_NOTIFICATION_SETTINGS,
  normalizeNotificationSettings,
  type NotificationSettings,
} from "../lib/notification-settings.ts";
import type { Kv } from "./kv.ts";

const KEY = ["settings", "notification"] as const;

/** ntfy 通知設定のストア。Kv は main.ts で生成したものを共有する。 */
export class NotificationSettingsStore {
  #kv: Kv;

  constructor(kv: Kv) {
    this.#kv = kv;
  }

  /**
   * 保存済み設定。トグル追加前の旧形状は false で補完し、未保存・不正値
   * なら既定値 (通知無効) を返す。
   */
  async get(): Promise<NotificationSettings> {
    const value = await this.#kv.get([...KEY]);
    return normalizeNotificationSettings(value) ??
      DEFAULT_NOTIFICATION_SETTINGS;
  }

  /** 設定を全上書きで保存する。 */
  async set(settings: NotificationSettings): Promise<NotificationSettings> {
    await this.#kv.set([...KEY], settings);
    return settings;
  }
}
