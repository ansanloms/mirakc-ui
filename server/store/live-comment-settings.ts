/**
 * 実況連携設定の永続化。キーは `["settings", "live-comment", <id>]` —
 * 設定系は `["settings", ...]` 名前空間に集約する。汎用の collectionStore
 * (server/store/kv.ts) に prefix と型ガードを渡すだけの薄い構成。並び順は
 * collectionStore の既定 (createdAt 降順 → id = 登録の新しい順) をそのまま使う。
 *
 * keyword-rules と同じ id レベル CRUD。旧シングルトン形状 (取得元キーの配列)
 * が KV に残っていても isLiveCommentMapping (構造検証) で弾かれ list から除かれる
 * ため、読み戻しでクラッシュしない。
 */

import {
  isLiveCommentMapping,
  type LiveCommentMapping,
  type LiveCommentMappingInput,
} from "../lib/live-comment-settings.ts";
import { type CollectionStore, collectionStore, type Kv } from "./kv.ts";

export type LiveCommentMappingStore = CollectionStore<
  LiveCommentMapping,
  LiveCommentMappingInput
>;

/** 実況連携設定のストア。Kv は main.ts で生成したものを共有する。 */
export function createLiveCommentMappingStore(
  kv: Kv,
): LiveCommentMappingStore {
  return collectionStore<LiveCommentMappingInput, LiveCommentMapping>(kv, {
    prefix: ["settings", "live-comment"],
    isValid: isLiveCommentMapping,
  });
}
