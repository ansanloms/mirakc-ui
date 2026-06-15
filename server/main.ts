import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { createMirakcProxy } from "./routes/mirakc.ts";
import { transcode } from "./routes/transcode.ts";
import { createKeywordRulesRoutes } from "./routes/keyword-rules.ts";
import { createNotificationSettingsRoutes } from "./routes/notification-settings.ts";
import { createLiveCommentSettingsRoutes } from "./routes/live-comment-settings.ts";
import { createCommentsRoutes } from "./routes/comments.ts";
import { createNicoliveSource } from "./lib/comments/sources/nicolive.ts";
import { createNxJikkyoSource } from "./lib/comments/sources/nx-jikkyo.ts";
import type { CommentTarget } from "./lib/comments/types.ts";
import type { LiveCommentSourceId } from "./lib/live-comment-settings.ts";
import { createKv } from "./store/kv.ts";
import { createKeywordRuleStore } from "./store/keyword-rules.ts";
import { createNotificationSettingsStore } from "./store/notification-settings.ts";
import { createLiveCommentMappingStore } from "./store/live-comment-settings.ts";
import {
  hasEnabledDestination,
  isValidDiscordWebhookUrl,
  isValidNtfyUrl,
  type NotificationEventKey,
} from "./lib/notification-settings.ts";
import { type NtfyNotification, sendNtfy } from "./lib/ntfy.ts";
import { sendDiscord } from "./lib/discord.ts";
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
 * 対応トグルが有効なとき、妥当な通知先 (ntfy / Discord) すべてへ並行送信する。
 * 設定は送信のたびに KV から読み直すため、保存後の反映に再起動は不要。
 * いずれか 1 つでも送信に成功すれば true。
 */
async function notifyIfEnabled(
  key: NotificationEventKey,
  notification: NtfyNotification,
): Promise<boolean> {
  const settings = await notificationSettingsStore.get();
  if (!hasEnabledDestination(settings, key)) {
    return false;
  }
  const sends: Promise<boolean>[] = [];
  if (isValidNtfyUrl(settings.url)) {
    sends.push(
      sendNtfy({ url: settings.url, token: settings.token }, notification),
    );
  }
  if (isValidDiscordWebhookUrl(settings.discordWebhookUrl)) {
    sends.push(
      sendDiscord({ webhookUrl: settings.discordWebhookUrl }, notification),
    );
  }
  const results = await Promise.all(sends);
  return results.some((ok) => ok);
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
// 通知設定 (取得・保存・テスト送信)。テストは宛先別エンドポイント
// (/test/ntfy・/test/discord) で ntfy / Discord に分かれる。
const testNotification = (): NtfyNotification => ({
  title: t("notification.test.title"),
  message: t("notification.test.message"),
  tags: ["bell"],
});
app.route(
  "/api/notification-settings",
  createNotificationSettingsRoutes(notificationSettingsStore, {
    sendTestNtfy: (target) => sendNtfy(target, testNotification()),
    sendTestDiscord: (target) => sendDiscord(target, testNotification()),
  }),
);
// 実況コメントの SSE 中継 (視聴画面の実況タブ)。取得元はプラッガブルで、
// ニコ生 (本家ニコニコ実況、NDGR) と NX-Jikkyo を束ねる。各取得元のチャンネル
// ID 解決は購読のたびに実況連携設定 (/settings/live-comments) を KV から読むため、
// 保存後の反映に再起動は不要。対象チャンネル (MirakurunChannel.channel) に一致する
// 有効なエントリから取得元の channelId を引く。未登録なら null = 実況非対応
// (組み込みフォールバックは廃止。デフォルトは設定画面の一括登録で KV へ入れる)。
// 同一チャンネルが複数エントリに登録されていてもよく、取得元ごとに最初の有効な
// 割り当てを使う (uniq 兼用)。
const resolveChannelId =
  (source: LiveCommentSourceId) =>
  async (target: CommentTarget): Promise<string | null> => {
    if (target.channel === undefined) {
      return null;
    }
    for (const mapping of await liveCommentSettingsStore.list()) {
      if (!mapping.enabled || mapping.channel !== target.channel) {
        continue;
      }
      const assignment = mapping.assignments.find((a) => a.source === source);
      if (assignment !== undefined) {
        return assignment.channelId;
      }
    }
    return null;
  };
app.route(
  "/api/comments",
  createCommentsRoutes({
    mirakcApiUrl: apiUrl,
    sources: [
      createNicoliveSource({ resolveChannelId: resolveChannelId("nicolive") }),
      createNxJikkyoSource({ resolveChannelId: resolveChannelId("nx-jikkyo") }),
    ],
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
      // 通知が無効 (トグル OFF か妥当な通知先なし) なら、無駄な番組情報の取得を
      // 避けて早期 return する。ntfy / Discord いずれかが設定済みなら続行。
      const settings = await notificationSettingsStore.get();
      if (!hasEnabledDestination(settings, key)) {
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
