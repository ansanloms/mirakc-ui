import { useCallback, useEffect, useRef, useState } from "react";
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
 *   EventSource を閉じる。候補が複数なら視聴側で取得元フィルタを出す。
 * - 取得元の選択状態は localStorage に永続化し、チャンネルをまたいで保つ。
 *   再接続で sources が再送されても選択はリセットしない。
 * - `comments` は選択中の取得元のみにフィルタ済み。
 * - コメント投稿は現状未対応 (受信専用)。
 */

const STORAGE_KEY = "mirakc-ui:live-comment-sources";

/** 取得元選択の永続化 (テスト差し替え用)。 */
export type SourceSelectionStorage = {
  load: () => CommentSourceId[] | null;
  save: (ids: CommentSourceId[]) => void;
};

export type LiveCommentsOptions = {
  /** EventSource の生成 (テスト差し替え用)。 */
  createEventSource?: (url: string) => EventSource;
  /** 保持する最大件数。超えたら古いものから捨てる。既定 300。 */
  limit?: number;
  /** 取得元選択の永続化。既定は localStorage。 */
  storage?: SourceSelectionStorage;
};

function defaultStorage(): SourceSelectionStorage {
  return {
    load() {
      try {
        const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
        return Array.isArray(value) ? value : null;
      } catch {
        return null;
      }
    },
    save(ids) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
      } catch {
        // localStorage 不可の環境では永続化しないだけ
      }
    },
  };
}

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
  /** 選択中の取得元にフィルタ済みのコメント (古い順)。 */
  comments: LiveComment[];
  /** 接続済みで対応取得元が 1 つ以上あるか。 */
  connected: boolean;
  /** サーバが購読できた取得元の一覧 (フィルタチップの候補)。 */
  sources: CommentSourceId[];
  /** 表示中の取得元。 */
  selectedSources: CommentSourceId[];
  /** 取得元の表示 ON/OFF を切り替える。 */
  toggleSource: (id: CommentSourceId) => void;
} {
  const { createEventSource, limit = 300 } = options;
  const storageRef = useRef<SourceSelectionStorage>(
    options.storage ?? defaultStorage(),
  );
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [connected, setConnected] = useState(false);
  const [sources, setSources] = useState<CommentSourceId[]>([]);
  const [selectedSources, setSelectedSources] = useState<CommentSourceId[]>([]);
  // 最新 sources を toggleSource (安定参照) から読むための ref。
  const sourcesRef = useRef<CommentSourceId[]>([]);
  sourcesRef.current = sources;
  // 取得元の初回受信で選択を初期化したか (再接続でリセットしないため)。
  const initializedRef = useRef(false);

  useEffect(() => {
    setComments([]);
    setConnected(false);
    setSources([]);
    setSelectedSources([]);
    initializedRef.current = false;
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
      const available = list as CommentSourceId[];
      setConnected(true);
      setSources(available);
      setSelectedSources((prev) => {
        if (initializedRef.current) {
          // 再接続: 現在の選択を available で絞るだけ (リセットしない)。
          return prev.filter((id) => available.includes(id));
        }
        initializedRef.current = true;
        const saved = storageRef.current.load();
        return saved === null
          ? available
          : saved.filter((id) => available.includes(id));
      });
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

  const toggleSource = useCallback((id: CommentSourceId) => {
    setSelectedSources((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      // sources の順序を保って整列する。
      const ordered = sourcesRef.current.filter((source) => next.has(source));
      storageRef.current.save(ordered);
      return ordered;
    });
  }, []);

  const shown = comments.filter((comment) =>
    selectedSources.includes(comment.source)
  );

  return { comments: shown, connected, sources, selectedSources, toggleSource };
}
