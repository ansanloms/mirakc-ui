/**
 * キーワード自動録画ルールの永続化。キーは
 * `["settings", "keyword-rules", <id>]` — 今後の設定系も `["settings", ...]`
 * 名前空間に追加していく。KV の接続・基本操作は server/store/kv.ts に委ねる。
 */

import {
  isKeywordRule,
  type KeywordRule,
  type KeywordRuleInput,
} from "../lib/keyword-rules.ts";
import type { Kv } from "./kv.ts";

const PREFIX = ["settings", "keyword-rules"] as const;

function keyOf(id: string): Deno.KvKey {
  return [...PREFIX, id];
}

/** キーワードルールのストア。Kv は main.ts で生成したものを共有する。 */
export class KeywordRuleStore {
  #kv: Kv;

  constructor(kv: Kv) {
    this.#kv = kv;
  }

  /** 保存済みルールの一覧 (登録の新しい順)。 */
  async list(): Promise<KeywordRule[]> {
    const values = await this.#kv.listValues([...PREFIX]);
    return values
      .filter(isKeywordRule)
      .sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id));
  }

  /** ルールを追加する。 */
  async add(
    input: KeywordRuleInput,
    now: number = Date.now(),
  ): Promise<KeywordRule> {
    const rule: KeywordRule = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
    };
    await this.#kv.set(keyOf(rule.id), rule);
    return rule;
  }

  /** 既存ルールを上書きする。id / createdAt は維持。無ければ null。 */
  async update(
    id: string,
    input: KeywordRuleInput,
  ): Promise<KeywordRule | null> {
    const current = await this.#kv.get(keyOf(id));
    if (!isKeywordRule(current)) {
      return null;
    }
    const rule: KeywordRule = {
      ...input,
      id,
      createdAt: current.createdAt,
    };
    await this.#kv.set(keyOf(id), rule);
    return rule;
  }

  /** id 一致のルールを削除する。削除したら true、見つからなければ false。 */
  remove(id: string): Promise<boolean> {
    return this.#kv.remove(keyOf(id));
  }
}
