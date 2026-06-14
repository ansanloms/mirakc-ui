/**
 * 実況連携設定の永続化。キーは `["settings", "live-comment"]` の単一値。
 * KV の接続・基本操作は汎用の singletonStore (server/store/kv.ts) に委ねる。
 *
 * notification-settings と違い get は未保存・不正値で null を返す (呼び出し側が
 * 組み込みの対照表 server/lib/comments/jikkyo.ts にフォールバックするため)。
 * 一方 set は具体値を保存するため、get は nullable・set は非 nullable という
 * 非対称な型にする (singletonStore<T|null> をラップして set だけ絞る)。
 */

import {
  type LiveCommentSettings,
  normalizeLiveCommentSettings,
} from "../lib/live-comment-settings.ts";
import { type Kv, singletonStore } from "./kv.ts";

export type LiveCommentSettingsStore = {
  /** 保存済み設定。未保存・不正値なら null。 */
  get(): Promise<LiveCommentSettings | null>;
  /** 設定を全上書きで保存する。 */
  set(settings: LiveCommentSettings): Promise<LiveCommentSettings>;
};

/** 実況連携設定のストア。Kv は main.ts で生成したものを共有する。 */
export function createLiveCommentSettingsStore(
  kv: Kv,
): LiveCommentSettingsStore {
  const base = singletonStore<LiveCommentSettings | null>(kv, {
    key: ["settings", "live-comment"],
    normalize: (value) => normalizeLiveCommentSettings(value),
  });
  return {
    get: () => base.get(),
    // set は非 null を保存して同じ値を返す (base.set は渡した値をそのまま返す)。
    set: (settings) => base.set(settings) as Promise<LiveCommentSettings>,
  };
}
