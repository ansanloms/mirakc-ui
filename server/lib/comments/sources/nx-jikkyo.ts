/**
 * NX-Jikkyo (ニコニコ実況の後継互換サービス) のコメントソース。
 *
 * tsukumijima 氏運営の NX-Jikkyo から、本家ニコ生に公式チャンネルが無い局
 * (BS 民放等) も含めて受信する。本家 NDGR と異なり旧ニコ生コメントサーバ形式
 * (XMLSocket 時代の thread コマンド) を WebSocket でそのまま喋るため、
 * ws/comment 直結 + thread 空文字のハンドシェイクだけで受信できる
 * (視聴セッション・threadkey 不要、未ログイン可)。
 *
 * 流れ:
 *   1. wss://nx-jikkyo.tsukumijima.net/api/v1/channels/{jk}/ws/comment に接続
 *   2. open 時に thread コマンド (version 20061206, thread "" で現在スレッド
 *      自動接続, res_from 負値で直近 N 件 + 以降リアルタイム) を送信
 *   3. chat メッセージを SourceComment に正規化して流す
 *
 * プロトコルの参考実装 (MIT): tsukumijima/KonomiTV (LiveCommentManager.ts の
 * initCommentSession)、tsukumijima/NX-Jikkyo。GPL の n-air-app・無ライセンスの
 * NDGRClient-ts は参照しない。
 * 非公式利用のため、壊れたら再接続を繰り返すだけに留め視聴機能本体に影響させない。
 */

import { AsyncQueue } from "../async-queue.ts";
import type {
  CommentSource,
  CommentSubscribeOptions,
  CommentTarget,
  SourceComment,
} from "../types.ts";

const COMMENT_WS_BASE = "wss://nx-jikkyo.tsukumijima.net/api/v1/channels";

/** コメントセッション WebSocket の構造的な最小インターフェイス (テスト差し替え用)。 */
export type CommentSocket = {
  onopen: (() => void) | null;
  onmessage: ((event: { data: unknown }) => void) | null;
  onerror: (() => void) | null;
  onclose: (() => void) | null;
  send(data: string): void;
  close(): void;
};

export type NxJikkyoSourceOptions = {
  /**
   * 対象チャンネル → 実況チャンネル番号 (例: "jk1") の解決。ソースは対照表を
   * 持たず、main.ts が実況連携設定 (KV) を参照する resolver を注入する
   * (テストではフェイク注入)。null = 実況非対応。
   */
  resolveChannelId: (
    target: CommentTarget,
  ) => string | null | Promise<string | null>;
  createWebSocket?: (url: string) => CommentSocket;
  /** 切断・エラー時の再接続待ち (ms)。既定 10 秒。 */
  retryDelayMs?: number;
  /** 初回取得件数 (負値で直近 N 件 + 以降リアルタイム)。既定 -100。 */
  resFrom?: number;
};

type Deps = Required<Omit<NxJikkyoSourceOptions, "resolveChannelId">>;

/** chat メッセージを正規化する。本文が無ければ null。 */
function toComment(chat: Record<string, unknown>): SourceComment | null {
  if (typeof chat.content !== "string") {
    return null;
  }
  const date = typeof chat.date === "number" ? chat.date : 0;
  // 0 のフィールドは本家仕様で省略されるため、欠損は 0 として扱う。
  const dateUsec = typeof chat.date_usec === "number" ? chat.date_usec : 0;
  const no = typeof chat.no === "number" ? chat.no : 0;
  const thread = typeof chat.thread === "string"
    ? chat.thread
    : typeof chat.thread === "number"
    ? String(chat.thread)
    : "";
  return {
    // no はスレッド内連番。スレッド跨ぎの衝突を避けるため thread と組む。
    id: `${thread}:${no}`,
    source: "nx-jikkyo",
    at: date * 1000 + Math.floor(dateUsec / 1000),
    text: chat.content,
    // user_id は匿名ハッシュ (nicolive:a:…) で表示名にならないため author は出さない
    // (本家 NDGR の匿名コメントと表示を揃える)。
  };
}

/** signal の abort で早期解決する待機。 */
function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      resolve();
    };
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

/** 重複排除用 ID 集合。古いものから捨てて上限を保つ。 */
function remember(seen: Set<string>, id: string): void {
  seen.add(id);
  if (seen.size <= 2_000) {
    return;
  }
  for (const value of seen) {
    seen.delete(value);
    if (seen.size <= 1_000) {
      break;
    }
  }
}

/** 接続〜再試行のループ。signal が abort されるまで回り続ける。 */
async function* streamComments(
  deps: Deps,
  jk: string,
  signal: AbortSignal,
): AsyncGenerator<SourceComment> {
  // seen は再接続をまたいで保持し、res_from の再取得分の重複を抑える。
  const seen = new Set<string>();

  while (!signal.aborted) {
    const queue = new AsyncQueue<SourceComment>();
    let socket: CommentSocket | null = null;
    const onAbort = () => {
      try {
        socket?.close();
      } catch {
        // 既に閉じている場合は無視
      }
      queue.close();
    };
    signal.addEventListener("abort", onAbort, { once: true });

    try {
      socket = deps.createWebSocket(`${COMMENT_WS_BASE}/${jk}/ws/comment`);
      socket.onopen = () => {
        socket!.send(JSON.stringify([
          { ping: { content: "rs:0" } },
          {
            thread: {
              version: "20061206",
              thread: "",
              user_id: "",
              res_from: deps.resFrom,
            },
          },
          { ping: { content: "rf:0" } },
        ]));
      };
      socket.onmessage = (event) => {
        let message: unknown;
        try {
          message = JSON.parse(String(event.data));
        } catch {
          return;
        }
        if (
          message === null || typeof message !== "object" ||
          !("chat" in message)
        ) {
          return;
        }
        const chat = (message as { chat: unknown }).chat;
        if (typeof chat !== "object" || chat === null) {
          return;
        }
        const comment = toComment(chat as Record<string, unknown>);
        if (comment !== null && !seen.has(comment.id)) {
          remember(seen, comment.id);
          queue.push(comment);
        }
      };
      socket.onerror = () =>
        queue.close(new Error("nx-jikkyo websocket error"));
      socket.onclose = () =>
        queue.close(
          signal.aborted ? undefined : new Error("nx-jikkyo websocket closed"),
        );

      yield* queue;
    } catch (e) {
      if (!signal.aborted) {
        console.error(`[comments:nx-jikkyo] ${jk}: stream error:`, e);
      }
    } finally {
      signal.removeEventListener("abort", onAbort);
      try {
        socket?.close();
      } catch {
        // 既に閉じている場合は無視
      }
    }

    if (!signal.aborted) {
      await delay(deps.retryDelayMs, signal);
    }
  }
}

/** NX-Jikkyo のコメントソースを作る。 */
export function createNxJikkyoSource(
  options: NxJikkyoSourceOptions,
): CommentSource {
  const resolveChannelId = options.resolveChannelId;
  const deps: Deps = {
    createWebSocket: options.createWebSocket ??
      ((url: string) => new WebSocket(url) as unknown as CommentSocket),
    retryDelayMs: options.retryDelayMs ?? 10_000,
    resFrom: options.resFrom ?? -100,
  };
  return {
    id: "nx-jikkyo",
    async subscribe(
      target: CommentTarget,
      { signal }: CommentSubscribeOptions,
    ) {
      const jk = await resolveChannelId(target);
      if (jk === null) {
        return null;
      }
      return streamComments(deps, jk, signal);
    },
  };
}
