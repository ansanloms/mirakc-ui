/**
 * コメント取得元 (source) の表示メタ。
 *
 * 色・順序は言語非依存の構造データとして code に置き、ラベル・タグは
 * locales (liveComment.source.*) から引く ([[表示文言は全て locales]] に準拠)。
 * source 識別子は server の CommentSourceId と同一。
 */
import type { CommentSourceId } from "../../server/lib/comments/types.ts";
import { t } from "../locales/i18n.ts";

/** 取得元の表示順 (フィルタチップ・コメントバッジ)。 */
export const COMMENT_SOURCE_ORDER: CommentSourceId[] = [
  "nicolive",
  "nx-jikkyo",
  "bsky",
];

/** 取得元の識別色 (チップのドット・コメントバッジ)。 */
export const COMMENT_SOURCE_COLOR: Record<CommentSourceId, string> = {
  "nicolive": "#e8823a",
  "nx-jikkyo": "#27b06e",
  "bsky": "#3a8ef0",
};

/** 取得元の表示ラベル (フィルタチップ・設定セグメント)。 */
export function commentSourceLabel(id: CommentSourceId): string {
  return t(`liveComment.source.${id}.label`);
}

/** 取得元の短いタグ (コメントバッジ)。 */
export function commentSourceTag(id: CommentSourceId): string {
  return t(`liveComment.source.${id}.tag`);
}

/** 既知の表示順に並べる (未知の取得元は末尾)。 */
export function sortCommentSources(
  ids: CommentSourceId[],
): CommentSourceId[] {
  const orderOf = (id: CommentSourceId): number => {
    const index = COMMENT_SOURCE_ORDER.indexOf(id);
    return index === -1 ? COMMENT_SOURCE_ORDER.length : index;
  };
  return [...ids].sort((a, b) => orderOf(a) - orderOf(b));
}
