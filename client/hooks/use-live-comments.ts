import { useEffect, useState } from "react";
import type { SourceComment } from "../../server/lib/comments/types.ts";
import type { LiveComment } from "../lib/live-comment.ts";
import { formatHm } from "../lib/datetime.ts";

/**
 * 実況コメントの供給。
 *
 * server の SSE 中継 (`/api/comments/services/:id/stream`) を購読し、受信した
 * `SourceComment` を表示用の `LiveComment` に変換して積む。ソース (ニコ生 /
 * NX-Jikkyo / Bluesky) の束ね方は server 側の責務で、client はソース非依存。
 *
 * - `sources` イベント (対応ソース一覧) が空 = 実況非対応チャンネル。
 *   再接続してもコメントは来ないので EventSource を閉じる。
 * - 切断時は EventSource が自動再接続する。接続状態は `connected` で返す。
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
  };
}

export function useLiveComments(
  serviceId: number | undefined,
  options: LiveCommentsOptions = {},
): {
  comments: LiveComment[];
  /** 接続済みで対応ソースが 1 つ以上あるか。実況タブの未接続表示に使う。 */
  connected: boolean;
} {
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [connected, setConnected] = useState(false);
  const { createEventSource, limit = 300 } = options;

  useEffect(() => {
    setComments([]);
    setConnected(false);
    if (serviceId === undefined) {
      return;
    }

    const url = `/api/comments/services/${serviceId}/stream`;
    const source = createEventSource !== undefined
      ? createEventSource(url)
      : new EventSource(url);

    const onSources = (event: MessageEvent) => {
      try {
        const sources: unknown = JSON.parse(event.data);
        if (Array.isArray(sources) && sources.length > 0) {
          setConnected(true);
        } else {
          // 実況非対応チャンネル。再接続しても変わらないため閉じる。
          setConnected(false);
          source.close();
        }
      } catch {
        // 不正なイベントは無視
      }
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

  return { comments, connected };
}
