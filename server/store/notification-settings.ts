/**
 * ntfy 通知設定の永続化。キーは `["settings", "notification"]` の単一値。
 * 汎用の singletonStore (server/store/kv.ts) にキーと正規化関数を渡すだけの
 * 薄い構成。
 */

import {
  DEFAULT_NOTIFICATION_SETTINGS,
  normalizeNotificationSettings,
  type NotificationSettings,
} from "../lib/notification-settings.ts";
import { type Kv, type SingletonStore, singletonStore } from "./kv.ts";

export type NotificationSettingsStore = SingletonStore<NotificationSettings>;

/**
 * ntfy 通知設定のストア。Kv は main.ts で生成したものを共有する。
 * get はトグル追加前の旧形状を false で補完し、未保存・不正値なら既定値
 * (通知無効) を返す。
 */
export function createNotificationSettingsStore(
  kv: Kv,
): NotificationSettingsStore {
  return singletonStore<NotificationSettings>(kv, {
    key: ["settings", "notification"],
    normalize: (value) =>
      normalizeNotificationSettings(value) ?? DEFAULT_NOTIFICATION_SETTINGS,
  });
}
