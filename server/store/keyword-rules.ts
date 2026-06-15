/**
 * キーワード自動録画ルールの永続化。キーは
 * `["settings", "keyword-rules", <id>]` — 今後の設定系も `["settings", ...]`
 * 名前空間に追加していく。汎用の collectionStore (server/store/kv.ts) に
 * prefix と型ガードを渡すだけの薄い構成。並び順は collectionStore の既定
 * (createdAt 降順 → id = 登録の新しい順) をそのまま使う。
 */

import {
  isKeywordRule,
  type KeywordRule,
  type KeywordRuleInput,
} from "../lib/keyword-rules.ts";
import { type CollectionStore, collectionStore, type Kv } from "./kv.ts";

export type KeywordRuleStore = CollectionStore<KeywordRule, KeywordRuleInput>;

/**
 * 読み戻したルールを現行スキーマへ均す。チャンネル条件を service 単位
 * (`serviceIds`) からチャンネル単位 (`channels`) へ移行した際の後方互換:
 * 旧 `serviceIds` は service→channel の解決に mirakc データが要るためここでは
 * 変換できない。旧ルールは `channels: []` (= 全チャンネル) にフォールバックし、
 * クラッシュさせずに残す (絞り込みは失われるので必要なら再登録)。
 */
function normalizeStoredKeywordRule(value: unknown): unknown {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return value;
  }
  const { serviceIds: _legacy, ...rest } = value as Record<string, unknown>;
  return "channels" in rest ? rest : { ...rest, channels: [] };
}

/** キーワードルールのストア。Kv は main.ts で生成したものを共有する。 */
export function createKeywordRuleStore(kv: Kv): KeywordRuleStore {
  return collectionStore<KeywordRuleInput, KeywordRule>(kv, {
    prefix: ["settings", "keyword-rules"],
    isValid: isKeywordRule,
    normalize: normalizeStoredKeywordRule,
  });
}
