import type { CommentSourceId } from "../../server/lib/comments/types.ts";

/**
 * 実況コメント 1 件。データ源 (ニコ生 / NX-Jikkyo 等) に非依存な表示用の型。
 */
export type LiveComment = {
  /** 一意キー。 */
  id: string;
  /** 投稿者名。 */
  name: string;
  /** 名前の色 (oklch hue, 0..360)。表示側で `oklch(... hue)` に展開する。 */
  colorHue: number;
  /** 本文。 */
  text: string;
  /** 表示時刻 (HH:mm)。 */
  time: string;
  /** 自分の投稿か。 */
  me: boolean;
  /** 取得元 (フィルタ・取得元バッジに使う)。 */
  source: CommentSourceId;
};
