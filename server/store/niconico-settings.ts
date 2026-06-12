/**
 * ニコニコ実況連携設定の永続化。キーは `["settings", "niconico"]` の単一値。
 * KV の接続・基本操作は server/store/kv.ts に委ねる。
 */

import {
  type NiconicoSettings,
  normalizeNiconicoSettings,
} from "../lib/niconico-settings.ts";
import type { Kv } from "./kv.ts";

const KEY = ["settings", "niconico"] as const;

/** ニコニコ実況連携設定のストア。Kv は main.ts で生成したものを共有する。 */
export class NiconicoSettingsStore {
  #kv: Kv;

  constructor(kv: Kv) {
    this.#kv = kv;
  }

  /**
   * 保存済み設定。未保存・不正値なら null を返し、呼び出し側は組み込みの
   * 対照表 (server/lib/comments/jikkyo.ts) にフォールバックする。
   */
  async get(): Promise<NiconicoSettings | null> {
    return normalizeNiconicoSettings(await this.#kv.get([...KEY]));
  }

  /** 設定を全上書きで保存する。 */
  async set(settings: NiconicoSettings): Promise<NiconicoSettings> {
    await this.#kv.set([...KEY], settings);
    return settings;
  }
}
