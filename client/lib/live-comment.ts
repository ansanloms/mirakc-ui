import type { components } from "./api/schema.d.ts";

type Program = components["schemas"]["MirakurunProgram"];

/**
 * 実況コメント 1 件。データ源 (将来のニコニコ実況等) に非依存な表示用の型。
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
};

/**
 * 実況コメントの供給。
 *
 * 現状はバックエンド未接続のため空配列を返す**スタブ**。番組視聴ページの
 * 実況タブはこの hook の戻り値だけに依存しているので、ここを差し替えれば
 * 表示コンポーネントを一切変えずにニコニコ実況等のストリームへ接続できる。
 *
 * 接続実装の指針:
 *   - `program` (またはサービス) からニコニコ実況の対象を解決する。
 *   - WebSocket / SSE 等で受信したコメントを `LiveComment` に正規化して
 *     state に積み、`comments` として返す。
 *   - `post` をユーザ投稿の送信に配線する (未対応ならスローせず no-op)。
 */
export function useLiveComments(_program?: Program): {
  comments: LiveComment[];
  /** 接続済みか。未接続なら実況タブ側で「未接続」表示にできる。 */
  connected: boolean;
  /** ユーザ投稿。未接続時は no-op。 */
  post: (text: string) => void;
} {
  return {
    comments: [],
    connected: false,
    post: () => {},
  };
}
