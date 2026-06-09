import type { components } from "../lib/api/schema.d.ts";
import type { LiveComment } from "../lib/live-comment.ts";

type Program = components["schemas"]["MirakurunProgram"];

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
