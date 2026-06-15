import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { createMirakcProxy } from "./routes/mirakc.ts";
import { transcode } from "./routes/transcode.ts";
import { createKeywordRulesRoutes } from "./routes/keyword-rules.ts";
import { createNotificationSettingsRoutes } from "./routes/notification-settings.ts";
import { createLiveCommentSettingsRoutes } from "./routes/live-comment-settings.ts";
import { createKv } from "./store/kv.ts";
import { createKeywordRuleStore } from "./store/keyword-rules.ts";
import { createNotificationSettingsStore } from "./store/notification-settings.ts";
import { createLiveCommentMappingStore } from "./store/live-comment-settings.ts";
import {
  isValidNtfyUrl,
  type NotificationEventKey,
} from "./lib/notification-settings.ts";
import { type NtfyNotification, sendNtfy } from "./lib/ntfy.ts";
import {
  notifyProgramEvent,
  type RecordingEventKind,
  recordingEventOf,
  subscribeMirakcEvents,
} from "./lib/mirakc-events.ts";
import {
  type KeywordRecordingJob,
  startKeywordRecordingJob,
} from "./lib/keyword-recorder.ts";
import { mirakcApiUrlOf, mirakcEventsUrlOf } from "./lib/mirakc.ts";
import { t } from "./locales/i18n.ts";

const app = new Hono();

// 設定系データの永続化先 (Deno KV、${DATA_DIR:-./data}/kv.sqlite3)。
// 1 接続を全 store で共有する。
const kv = createKv();
const keywordRuleStore = createKeywordRuleStore(kv);
const notificationSettingsStore = createNotificationSettingsStore(kv);
const liveCommentSettingsStore = createLiveCommentMappingStore(kv);

const mirakcUrl = Deno.env.get("MIRAKC_URL");
const apiUrl = mirakcUrl === undefined ? undefined : mirakcApiUrlOf(mirakcUrl);

// キーワード自動録画ジョブ。ルート定義より後 (MIRAKC_URL がある場合のみ)
// に生成されるため、ルートのフックからは nullable 経由で参照する。
let recordingJob: KeywordRecordingJob | null = null;

/**
 * 対応トグルが有効で URL が妥当なときだけ通知を送る。設定は送信のたびに
 * KV から読み直すため、保存後の反映に再起動は不要。
 */
async function notifyIfEnabled(
  key: NotificationEventKey,
  notification: NtfyNotification,
): Promise<boolean> {
  const settings = await notificationSettingsStore.get();
  if (!settings[key] || !isValidNtfyUrl(settings.url)) {
    return false;
  }
  return await sendNtfy(
    { url: settings.url, token: settings.token },
    notification,
  );
}

// --- API ---
// mirakc バックエンドへのプロキシ。予約の登録・削除 (UI からの手動操作) を
// フックで検知して通知につなげる (mirakc には対応する SSE イベントが無い)。
app.route(
  "/api/mirakc",
  createMirakcProxy({
    mirakcUrl,
    hooks: {
      onScheduleCreated: async (schedule) => {
        try {
          await notifyProgramEvent({
            apiUrl: apiUrl!,
            notify: (n) => notifyIfEnabled("onSchedule", n),
          }, {
            key: "scheduled",
            programId: schedule.program.id,
            program: schedule.program,
          });
        } catch (e) {
          console.error("[main] schedule notification failed:", e);
        }
      },
      onScheduleRemoved: async (programId) => {
        try {
          await notifyProgramEvent({
            apiUrl: apiUrl!,
            notify: (n) => notifyIfEnabled("onRemove", n),
          }, { key: "unscheduled", programId });
        } catch (e) {
          console.error("[main] unschedule notification failed:", e);
        }
      },
    },
  }),
);
// ライブ視聴のトランスコード配信 (mirakc → tsreadex → ffmpeg → MPEG-TS)。
app.route("/api/transcode", transcode);
// キーワード自動録画ルールの CRUD。ルールの登録・更新でジョブを再実行する
// (debounce 経由なので連続編集も 1 回に畳まれる)。
app.route(
  "/api/keyword-rules",
  createKeywordRulesRoutes(keywordRuleStore, {
    onChanged: () => recordingJob?.trigger(),
  }),
);
// ntfy 通知設定 (取得・保存・テスト送信)。
app.route(
  "/api/notification-settings",
  createNotificationSettingsRoutes(notificationSettingsStore, {
    sendTest: (target) =>
      sendNtfy(target, {
        title: t("notification.test.title"),
        message: t("notification.test.message"),
        tags: ["bell"],
      }),
  }),
);
// 実況コメントのチャンネル割り当ての設定 (id レベル CRUD)。
app.route(
  "/api/live-comment-settings",
  createLiveCommentSettingsRoutes(liveCommentSettingsStore),
);

// --- バックグラウンドジョブ ---
// キーワード自動録画と、mirakc の /events (SSE) 購読による録画開始/終了/
// 失敗の通知。ジョブは EPG 更新 (epg.programs-updated) を主トリガにし、
// 定期実行 (Deno.cron 相当) は SSE が長期間切れた場合のフォールバック。
if (mirakcUrl !== undefined && apiUrl !== undefined) {
  // キーワード自動録画ジョブ。予約の登録は通知設定に関係なく実行する。
  const minutes = Number(
    Deno.env.get("KEYWORD_RECORDING_INTERVAL_MINUTES") ?? "60",
  );
  const intervalMinutes = Number.isFinite(minutes) && minutes >= 1
    ? minutes
    : 60;
  recordingJob = startKeywordRecordingJob({
    mirakcApiUrl: apiUrl,
    listRules: () => keywordRuleStore.list(),
    notify: (n) => notifyIfEnabled("onSchedule", n),
  }, { intervalMs: intervalMinutes * 60_000 });
  const job = recordingJob;

  // 録画イベントの通知は設定トグル (開始/終了/失敗) で出し分ける。
  // 通知が無効でも先に判定し、無駄な番組情報の取得をしない。
  const TOGGLE_OF: Record<RecordingEventKind, NotificationEventKey> = {
    started: "onStart",
    stopped: "onEnd",
    failed: "onFail",
  };
  subscribeMirakcEvents({
    eventsUrl: mirakcEventsUrlOf(mirakcUrl),
    onEvent: async (event) => {
      // EPG 更新でキーワード録画を都度実行する。イベントはサービス単位で
      // バーストし、接続直後にも全サービス分のスナップショットが届くため、
      // trigger 側の debounce で 1 回の実行に畳まれる。
      if (event.event === "epg.programs-updated") {
        job.trigger();
        return;
      }

      const recording = recordingEventOf(event);
      if (recording === null) {
        return;
      }
      const key = TOGGLE_OF[recording.kind];
      const settings = await notificationSettingsStore.get();
      if (!settings[key] || !isValidNtfyUrl(settings.url)) {
        return;
      }
      await notifyProgramEvent({
        apiUrl,
        notify: (n) => notifyIfEnabled(key, n),
      }, { key: recording.kind, programId: recording.programId });
    },
  });
} else {
  console.error(
    "[main] MIRAKC_URL is not set; keyword recording and notifications are disabled",
  );
}

// --- 静的配信 (本番) ---
// Vite ビルド成果物 (client/dist) を配信する。開発時は Vite dev server が
// UI を担い、/api/* だけがこの Hono にプロキシされるため下記は実質本番専用。
app.use("/*", serveStatic({ root: "./client/dist" }));

// SPA フォールバック: 未知のパスは index.html を返してクライアントルーターに委ねる。
app.get("/*", serveStatic({ path: "./client/dist/index.html" }));

export default app;
