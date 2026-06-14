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

/** キーワードルールのストア。Kv は main.ts で生成したものを共有する。 */
export function createKeywordRuleStore(kv: Kv): KeywordRuleStore {
  return collectionStore<KeywordRuleInput, KeywordRule>(kv, {
    prefix: ["settings", "keyword-rules"],
    isValid: isKeywordRule,
  });
}
