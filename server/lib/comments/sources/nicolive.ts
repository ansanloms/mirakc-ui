/**
 * ニコ生 (本家ニコニコ実況) のコメントソース。
 *
 * 2024/08 以降のニコ生の新メッセージサーバー (NDGR) から未ログインで受信する。
 * View API は CORS 制限によりブラウザから直接叩けないため、このサーバが受信し
 * SSE で client へ中継する (server/routes/comments.ts)。流れ:
 *
 *   1. https://live.nicovideo.jp/watch/{ニコニコチャンネル ID} の HTML 内
 *      embedded-data から視聴セッション WebSocket URL と放送状態を取る
 *      (チャンネル ID を watch URL に渡すと放送中番組へ解決される)
 *   2. 視聴セッション WebSocket で startWatching を送り、messageServer
 *      メッセージから NDGR View API の URI を得る (取得後すぐ閉じる)
 *   3. View API (?at=now) の length-delimited Protobuf ストリームを読み、
 *      segment エントリの Segment API を並行受信してコメントを取り出す。
 *      next エントリのカーソルで View へ再接続し続ける
 *
 * プロトコルの参考実装 (MIT): https://github.com/tsukumijima/NDGRClient
 * 非公式利用のため、視聴ページの構造変更等で壊れたら再接続を繰り返すだけに
 * 留め、視聴機能本体には影響させない。
 */

import { AsyncQueue } from "../async-queue.ts";
import { lengthDelimited } from "../protobuf.ts";
import { decodeChunkedEntry, decodeChunkedMessage } from "../ndgr.ts";
import { nicoliveChannelIdOf } from "../jikkyo.ts";
import type {
  CommentSource,
  CommentSubscribeOptions,
  CommentTarget,
  SourceComment,
} from "../types.ts";

const USER_AGENT = "mirakc-ui (+https://github.com/ansanloms/mirakc-ui)";

/** 視聴セッション WebSocket の構造的な最小インターフェイス (テスト差し替え用)。 */
export type WatchSessionSocket = {
  onopen: (() => void) | null;
  onmessage: ((event: { data: unknown }) => void) | null;
  onerror: (() => void) | null;
  onclose: (() => void) | null;
  send(data: string): void;
  close(): void;
};

export type NicoliveSourceOptions = {
  /**
   * 対象チャンネル → ニコニコチャンネル ID (例: "ch2646436") の解決。
   * 既定は組み込みの対照表 (jikkyo.ts)。設定 (ニコニコ実況連携) を反映する
   * 場合は main.ts がストア参照の resolver を注入する。null = 実況非対応。
   */
  resolveChannelId?: (
    target: CommentTarget,
  ) => string | null | Promise<string | null>;
  fetchFn?: typeof fetch;
  createWebSocket?: (url: string) => WatchSessionSocket;
  /** 接続失敗・切断時の再試行待ち (ms)。既定 10 秒。 */
  retryDelayMs?: number;
  /** 放送休止中 (ON_AIR 以外) の再確認間隔 (ms)。既定 60 秒。 */
  offAirDelayMs?: number;
  /** NDGR ストリームが無通信のとき打ち切って再接続するまでの時間 (ms)。既定 90 秒。 */
  idleTimeoutMs?: number;
  /** 視聴セッション WebSocket の応答待ちタイムアウト (ms)。既定 15 秒。 */
  watchSessionTimeoutMs?: number;
};

type Deps = Required<Omit<NicoliveSourceOptions, "resolveChannelId">>;

export type NicoliveProgramInfo = {
  webSocketUrl: string | null;
  status: string | null;
};

// 実ページは <script id="embedded-data" data-props="..."> だが、タグ名・
// 属性順は変わりうるので id と data-props が同一タグ内にあることだけをみる。
const EMBEDDED_DATA_PATTERN =
  /<[^>]*\bid="embedded-data"[^>]*\bdata-props="([^"]*)"/;
const EMBEDDED_DATA_PATTERN_REVERSED =
  /<[^>]*\bdata-props="([^"]*)"[^>]*\bid="embedded-data"/;

function decodeHtmlEntities(value: string): string {
  return value
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

/**
 * 視聴ページ HTML の embedded-data (data-props 属性の JSON) から視聴セッション
 * WebSocket URL と放送状態を取り出す。embedded-data が見つからなければ例外。
 */
export function parseEmbeddedData(html: string): NicoliveProgramInfo {
  const match = html.match(EMBEDDED_DATA_PATTERN) ??
    html.match(EMBEDDED_DATA_PATTERN_REVERSED);
  if (match === null) {
    throw new Error("embedded-data not found in the watch page");
  }
  const props = JSON.parse(decodeHtmlEntities(match[1]));
  const webSocketUrl = props?.site?.relive?.webSocketUrl;
  const status = props?.program?.status;
  return {
    webSocketUrl: typeof webSocketUrl === "string" && webSocketUrl !== ""
      ? webSocketUrl
      : null,
    status: typeof status === "string" ? status : null,
  };
}

async function fetchProgramInfo(
  deps: Deps,
  channelId: string,
  signal: AbortSignal,
): Promise<NicoliveProgramInfo> {
  const res = await deps.fetchFn(
    `https://live.nicovideo.jp/watch/${channelId}`,
    { headers: { "user-agent": USER_AGENT }, signal },
  );
  if (!res.ok) {
    await res.body?.cancel();
    throw new Error(`watch page: ${res.status}`);
  }
  return parseEmbeddedData(await res.text());
}

/**
 * 視聴セッション WebSocket に startWatching を送り、messageServer メッセージ
 * から NDGR View API の URI を取り出す。URI が取れたらすぐ閉じる
 * (コメント受信に視聴セッションの維持は不要)。
 */
function fetchViewUri(
  deps: Deps,
  webSocketUrl: string,
  signal: AbortSignal,
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const socket = deps.createWebSocket(webSocketUrl);
    let settled = false;

    const finish = (result: { uri: string } | { error: Error }) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener("abort", onAbort);
      try {
        socket.close();
      } catch {
        // 既に閉じている場合は無視
      }
      if ("uri" in result) {
        resolve(result.uri);
      } else {
        reject(result.error);
      }
    };

    const timer = setTimeout(
      () => finish({ error: new Error("watch session timeout") }),
      deps.watchSessionTimeoutMs,
    );
    const onAbort = () =>
      finish({ error: new DOMException("aborted", "AbortError") });
    signal.addEventListener("abort", onAbort, { once: true });

    socket.onopen = () =>
      socket.send(
        JSON.stringify({ type: "startWatching", data: { reconnect: false } }),
      );
    socket.onmessage = (event) => {
      let message: { type?: string; data?: { viewUri?: unknown } };
      try {
        message = JSON.parse(String(event.data));
      } catch {
        return;
      }
      if (
        message.type === "messageServer" &&
        typeof message.data?.viewUri === "string"
      ) {
        finish({ uri: message.data.viewUri });
      } else if (message.type === "ping") {
        socket.send(JSON.stringify({ type: "pong" }));
      } else if (message.type === "error" || message.type === "disconnect") {
        finish({ error: new Error(`watch session: ${message.type}`) });
      }
    };
    socket.onerror = () =>
      finish({ error: new Error("watch session websocket error") });
    socket.onclose = () =>
      finish({ error: new Error("watch session closed unexpectedly") });
  });
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

/** 重複排除用 ID 集合。古いものから捨てて上限を保つ (Set は挿入順で列挙される)。 */
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

/**
 * NDGR View API のストリームを読み、Segment API を並行受信してコメントを
 * 流す。View ストリームが閉じたら next カーソルで再接続し続け、エラーや
 * 無通信タイムアウトは例外として呼び出し元 (再試行ループ) へ伝播する。
 */
async function* ndgrComments(
  deps: Deps,
  viewUri: string,
  signal: AbortSignal,
): AsyncGenerator<SourceComment> {
  const queue = new AsyncQueue<SourceComment>();
  const seen = new Set<string>();
  const inner = new AbortController();
  const onAbort = () => inner.abort();
  signal.addEventListener("abort", onAbort, { once: true });

  // 無通信ウォッチドッグ。entry / message を受けるたびに延長する。
  let idleTimer: ReturnType<typeof setTimeout> | undefined;
  const touch = () => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(
      () => inner.abort(new Error("NDGR stream idle timeout")),
      deps.idleTimeoutMs,
    );
  };

  const segmentPumps = new Set<Promise<void>>();
  const pumpSegment = async (uri: string) => {
    try {
      const res = await deps.fetchFn(uri, {
        headers: { "user-agent": USER_AGENT },
        signal: inner.signal,
      });
      if (!res.ok || res.body === null) {
        await res.body?.cancel();
        throw new Error(`NDGR segment api: ${res.status}`);
      }
      for await (const bytes of lengthDelimited(res.body)) {
        touch();
        const message = decodeChunkedMessage(bytes);
        if (
          message === null || message.chat === undefined || seen.has(message.id)
        ) {
          continue;
        }
        remember(seen, message.id);
        queue.push({
          id: message.id,
          source: "nicolive",
          at: message.atMs,
          text: message.chat.content,
          author: message.chat.name,
        });
      }
    } catch (e) {
      // segment 単位の失敗は致命傷にしない (次の segment で回復する)。
      if (!inner.signal.aborted) {
        console.error("[comments:nicolive] segment stream failed:", e);
      }
    }
  };
  const startSegment = (uri: string) => {
    const pump = pumpSegment(uri);
    segmentPumps.add(pump);
    pump.finally(() => segmentPumps.delete(pump));
  };

  const driver = (async () => {
    try {
      let at = "now";
      while (!inner.signal.aborted) {
        const res = await deps.fetchFn(`${viewUri}?at=${at}`, {
          headers: { "user-agent": USER_AGENT },
          signal: inner.signal,
        });
        if (!res.ok || res.body === null) {
          await res.body?.cancel();
          throw new Error(`NDGR view api: ${res.status}`);
        }
        let nextAt: number | null = null;
        for await (const bytes of lengthDelimited(res.body)) {
          touch();
          const entry = decodeChunkedEntry(bytes);
          if (entry.segmentUri !== undefined) {
            startSegment(entry.segmentUri);
          }
          if (entry.nextAt !== undefined) {
            nextAt = entry.nextAt;
          }
        }
        if (nextAt === null) {
          throw new Error("NDGR view stream ended without next cursor");
        }
        at = String(nextAt);
      }
      queue.close();
    } catch (e) {
      // 親の abort 由来なら正常終了として閉じる。
      queue.close(signal.aborted ? undefined : e);
    }
  })();

  touch();
  try {
    yield* queue;
  } finally {
    signal.removeEventListener("abort", onAbort);
    clearTimeout(idleTimer);
    inner.abort();
    await driver;
    await Promise.allSettled(segmentPumps);
  }
}

/** 接続〜再試行のループ。signal が abort されるまで回り続ける。 */
async function* streamComments(
  deps: Deps,
  channelId: string,
  signal: AbortSignal,
): AsyncGenerator<SourceComment> {
  while (!signal.aborted) {
    try {
      const info = await fetchProgramInfo(deps, channelId, signal);
      if (info.status !== "ON_AIR" || info.webSocketUrl === null) {
        await delay(deps.offAirDelayMs, signal);
        continue;
      }
      const viewUri = await fetchViewUri(deps, info.webSocketUrl, signal);
      yield* ndgrComments(deps, viewUri, signal);
    } catch (e) {
      if (signal.aborted) {
        break;
      }
      console.error(
        `[comments:nicolive] ${channelId}: stream error, retrying:`,
        e,
      );
      await delay(deps.retryDelayMs, signal);
    }
  }
}

/** ニコ生 (本家ニコニコ実況) のコメントソースを作る。 */
export function createNicoliveSource(
  options: NicoliveSourceOptions = {},
): CommentSource {
  const resolveChannelId = options.resolveChannelId ??
    ((target: CommentTarget) =>
      nicoliveChannelIdOf(target.networkId, target.serviceId));
  const deps: Deps = {
    fetchFn: options.fetchFn ?? fetch,
    createWebSocket: options.createWebSocket ??
      ((url: string) => new WebSocket(url) as unknown as WatchSessionSocket),
    retryDelayMs: options.retryDelayMs ?? 10_000,
    offAirDelayMs: options.offAirDelayMs ?? 60_000,
    idleTimeoutMs: options.idleTimeoutMs ?? 90_000,
    watchSessionTimeoutMs: options.watchSessionTimeoutMs ?? 15_000,
  };
  return {
    id: "nicolive",
    async subscribe(
      target: CommentTarget,
      { signal }: CommentSubscribeOptions,
    ) {
      const channelId = await resolveChannelId(target);
      if (channelId === null) {
        return null;
      }
      return streamComments(deps, channelId, signal);
    },
  };
}
