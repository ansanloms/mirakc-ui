import { useEffect, useState } from "react";
import type {
  CommentSourceId,
  SourceComment,
} from "../../server/lib/comments/types.ts";
import type { LiveComment } from "../lib/live-comment.ts";
import { formatHm } from "../lib/datetime.ts";

/**
 * 実況コメントの供給。
 *
 * server の SSE 中継 (`/api/comments/services/:id/stream`) を購読し、受信した
 * `SourceComment` を表示用の `LiveComment` に変換して積む。取得元 (ニコ生 /
 * NX-Jikkyo) の束ね方は server 側の責務。
 *
 * - `sources` イベント = サーバが購読できた取得元の一覧。空 = 実況非対応で
 *   EventSource を閉じる。複数あると各コメントに取得元バッジを出す (表示の
 *   出し分けのみ。取得元の有効/無効は設定画面 `/settings/live-comments` で行う)。
 * - コメント投稿は現状未対応 (受信専用)。
 */

export type LiveCommentsOptions = {
  /** EventSource の生成 (テスト差し替え用)。 */
  createEventSource?: (url: string) => EventSource;
  /** 保持する最大件数。超えたら古いものから捨てる。既定 300。 */
  limit?: number;
};

/** 名前の色 (oklch hue)。同じ投稿者は常に同じ色になるよう文字列から導出する。 */
function hueOf(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % 360;
}

/** 受信コメントを表示用に変換する。匿名 (author 無し) は名前を出さない。 */
export function toLiveComment(comment: SourceComment): LiveComment {
  return {
    id: `${comment.source}:${comment.id}`,
    name: comment.author ?? "",
    colorHue: hueOf(comment.author ?? comment.source),
    text: comment.text,
    time: formatHm(comment.at),
    me: false,
    source: comment.source,
  };
}

export function useLiveComments(
  serviceId: number | undefined,
  options: LiveCommentsOptions = {},
): {
  /** 受信したコメント (古い順)。 */
  comments: LiveComment[];
  /** 接続済みで対応取得元が 1 つ以上あるか。 */
  connected: boolean;
  /** サーバが購読できた取得元の一覧 (複数あると各コメントに取得元バッジを出す)。 */
  sources: CommentSourceId[];
} {
  const { createEventSource, limit = 300 } = options;
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [connected, setConnected] = useState(false);
  const [sources, setSources] = useState<CommentSourceId[]>([]);

  useEffect(() => {
    setComments([]);
    setConnected(false);
    setSources([]);
    if (serviceId === undefined) {
      return;
    }

    const url = `/api/comments/services/${serviceId}/stream`;
    const source = createEventSource !== undefined
      ? createEventSource(url)
      : new EventSource(url);

    const onSources = (event: MessageEvent) => {
      let list: unknown;
      try {
        list = JSON.parse(event.data);
      } catch {
        return;
      }
      if (!Array.isArray(list) || list.length === 0) {
        // 実況非対応チャンネル。再接続しても変わらないため閉じる。
        setConnected(false);
        source.close();
        return;
      }
      setConnected(true);
      setSources(list as CommentSourceId[]);
    };
    const onComment = (event: MessageEvent) => {
      try {
        const comment: SourceComment = JSON.parse(event.data);
        setComments((prev) => [...prev, toLiveComment(comment)].slice(-limit));
      } catch {
        // 不正なイベントは無視
      }
    };

    source.addEventListener("sources", onSources);
    source.addEventListener("comment", onComment);
    // 切断時は EventSource が自動再接続し、再接続後に sources が再送される。
    source.onerror = () => setConnected(false);

    return () => {
      source.close();
    };
  }, [serviceId, createEventSource, limit]);

  return { comments, connected, sources };
}
