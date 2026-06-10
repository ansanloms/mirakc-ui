/**
 * mirakc の SSE (`/events`) 購読。録画開始 (`recording.started`) / 録画終了
 * (`recording.stopped`) の通知に使う。
 *
 * 接続先 URL は server/lib/mirakc.ts (`mirakcEventsUrlOf` / `mirakcApiUrlOf`)
 * で `MIRAKC_URL` から組み立てて渡す。イベント仕様は mirakc の
 * docs/events.md を参照。
 */

import type { NtfyNotification } from "./ntfy.ts";
import { formatDisplayDateTime, formatDisplayTime } from "./datetime.ts";
import { t } from "../locales/i18n.ts";

export type SseEvent = { event: string; data: string };

/**
 * SSE ストリームを event / data の組に分解する。`:` で始まる keep-alive
 * コメント行は無視する。チャンク境界が行の途中でも復元する。
 */
export async function* parseSseStream(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<SseEvent> {
  const decoder = new TextDecoder();
  let buffer = "";
  let event = "";
  let data: string[] = [];

  const flush = (): SseEvent | null => {
    if (event === "" && data.length === 0) {
      return null;
    }
    const result = { event, data: data.join("\n") };
    event = "";
    data = [];
    return result;
  };

  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, newlineIndex).replace(/\r$/, "");
        buffer = buffer.slice(newlineIndex + 1);

        if (line === "") {
          const ev = flush();
          if (ev !== null) {
            yield ev;
          }
        } else if (line.startsWith(":")) {
          // keep-alive コメント。
        } else if (line.startsWith("event:")) {
          event = line.slice("event:".length).trim();
        } else if (line.startsWith("data:")) {
          data.push(line.slice("data:".length).trim());
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export type RecordingEventKind = "started" | "stopped";

export type RecordingEvent = {
  kind: RecordingEventKind;
  programId: number;
};

const RECORDING_EVENT_NAMES: Record<string, RecordingEventKind> = {
  "recording.started": "started",
  "recording.stopped": "stopped",
};

/**
 * 録画開始/終了イベントなら kind と programId、それ以外は null。
 * data は `{"programId": number}` (mirakc docs/events.md)。
 */
export function recordingEventOf(event: SseEvent): RecordingEvent | null {
  const kind = RECORDING_EVENT_NAMES[event.event];
  if (kind === undefined) {
    return null;
  }
  try {
    const data = JSON.parse(event.data);
    return typeof data?.programId === "number"
      ? { kind, programId: data.programId }
      : null;
  } catch {
    return null;
  }
}

export type SubscribeOptions = {
  /** mirakc の SSE エンドポイント (mirakcEventsUrlOf で構築)。 */
  eventsUrl: string;

  /** イベント受信ごとに呼ばれる。例外はログに残して購読を継続する。 */
  onEvent: (event: SseEvent) => void | Promise<void>;

  fetchFn?: typeof fetch;

  /** 切断時の再接続待ち (ms)。既定 5 秒。 */
  retryDelayMs?: number;
};

/**
 * mirakc の /events を購読する。切断・エラー時は retryDelayMs 待って
 * 再接続し続ける。戻り値の停止関数で打ち切る。
 */
export function subscribeMirakcEvents(options: SubscribeOptions): () => void {
  const url = options.eventsUrl;
  const fetchFn = options.fetchFn ?? fetch;
  const retryDelayMs = options.retryDelayMs ?? 5_000;

  let stopped = false;
  let controller: AbortController | null = null;

  (async () => {
    while (!stopped) {
      controller = new AbortController();
      try {
        const res = await fetchFn(url, {
          headers: { accept: "text/event-stream" },
          signal: controller.signal,
        });
        if (!res.ok || res.body === null) {
          await res.body?.cancel();
          throw new Error(`unexpected response: ${res.status}`);
        }
        for await (const event of parseSseStream(res.body)) {
          try {
            await options.onEvent(event);
          } catch (e) {
            console.error("[mirakc-events] event handler failed:", e);
          }
        }
      } catch (e) {
        if (!stopped) {
          console.error("[mirakc-events] connection lost:", e);
        }
      }
      if (!stopped) {
        await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
  })();

  return () => {
    stopped = true;
    controller?.abort();
  };
}

export type RecordingEventNotifierDeps = {
  /** mirakc の Web API のベース URL (mirakcApiUrlOf で構築)。 */
  apiUrl: string;
  notify: (notification: NtfyNotification) => Promise<unknown>;
  fetchFn?: typeof fetch;
  timeZone?: string;
};

// ntfy の tags (emoji shortcode) は表示文言ではなくメタデータなので code 側に置く。
const EVENT_TAGS: Record<RecordingEventKind, string> = {
  started: "arrow_forward",
  stopped: "white_check_mark",
};

type ProgramInfo = {
  name?: string | null;
  startAt?: number;
  duration?: number;
  networkId?: number;
  serviceId?: number;
};

/** 番組の属するサービス名を `GET /services` から引く。取れなければ null。 */
async function resolveServiceName(
  fetchFn: typeof fetch,
  apiUrl: string,
  program: ProgramInfo,
): Promise<string | null> {
  if (program.networkId === undefined || program.serviceId === undefined) {
    return null;
  }
  try {
    const res = await fetchFn(`${apiUrl}/services`);
    if (!res.ok) {
      await res.body?.cancel();
      return null;
    }
    const services: {
      networkId: number;
      serviceId: number;
      name: string;
    }[] = await res.json();
    return services.find(
      (service) =>
        service.networkId === program.networkId &&
        service.serviceId === program.serviceId,
    )?.name ?? null;
  } catch (e) {
    console.error("[mirakc-events] failed to fetch services:", e);
    return null;
  }
}

/** 放送時間の表示 (開始日時 〜 終了時刻)。開始時刻が無ければ null。 */
function airtimeOf(program: ProgramInfo, timeZone?: string): string | null {
  if (typeof program.startAt !== "number") {
    return null;
  }
  if (typeof program.duration !== "number") {
    return t("notification.recording.startedAt", {
      datetime: formatDisplayDateTime(program.startAt, timeZone),
    });
  }
  return t("notification.recording.airtime", {
    start: formatDisplayDateTime(program.startAt, timeZone),
    end: formatDisplayTime(program.startAt + program.duration, timeZone),
  });
}

/**
 * 録画開始/終了を通知する。番組名・チャンネル名・放送時間は mirakc API
 * (`GET /programs/{id}` / `GET /services`) で引く。番組情報が取れなくても
 * programId だけで通知は出す (通知の取りこぼしを優先して避ける)。
 */
export async function notifyRecordingEvent(
  deps: RecordingEventNotifierDeps,
  event: RecordingEvent,
): Promise<void> {
  const fetchFn = deps.fetchFn ?? fetch;
  const apiUrl = deps.apiUrl.replace(/\/$/, "");

  let program: ProgramInfo | null = null;
  try {
    const res = await fetchFn(`${apiUrl}/programs/${event.programId}`);
    if (res.ok) {
      program = await res.json();
    } else {
      await res.body?.cancel();
    }
  } catch (e) {
    console.error("[mirakc-events] failed to fetch program:", e);
  }

  const name = program?.name ??
    t("notification.recording.fallbackName", { programId: event.programId });
  const serviceName = program === null
    ? null
    : await resolveServiceName(fetchFn, apiUrl, program);
  const airtime = program === null ? null : airtimeOf(program, deps.timeZone);

  const message = [
    t(`notification.recording.${event.kind}.message`),
    serviceName,
    airtime,
  ].filter((line): line is string => line !== null).join("\n");

  await deps.notify({
    title: t(`notification.recording.${event.kind}.title`, { name }),
    message,
    tags: [EVENT_TAGS[event.kind]],
  });
}
