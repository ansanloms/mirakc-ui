import { Hono } from "hono";
import { serveStatic } from "hono/deno";
import { mirakc } from "./routes/mirakc.ts";
import { transcode } from "./routes/transcode.ts";
import { createKeywordRulesRoutes } from "./routes/keyword-rules.ts";
import { createNotificationSettingsRoutes } from "./routes/notification-settings.ts";
import { KeywordRuleStore } from "./lib/keyword-rules-store.ts";
import { NotificationSettingsStore } from "./lib/notification-settings-store.ts";
import { isValidNtfyUrl } from "./lib/notification-settings.ts";
import { sendNtfy } from "./lib/ntfy.ts";
import {
  notifyRecordingEvent,
  recordingEventOf,
  subscribeMirakcEvents,
} from "./lib/mirakc-events.ts";
import { mirakcApiUrlOf, mirakcEventsUrlOf } from "./lib/mirakc.ts";

const app = new Hono();

// 設定系データの永続化先 (Deno KV、パスは store 側で固定)。
const keywordRuleStore = new KeywordRuleStore();
const notificationSettingsStore = new NotificationSettingsStore();

// --- API ---
// mirakc バックエンドへのプロキシ。
app.route("/api/mirakc", mirakc);
// ライブ視聴のトランスコード配信 (mirakc → tsreadex → ffmpeg → MPEG-TS)。
app.route("/api/transcode", transcode);
// キーワード自動録画ルールの CRUD。
app.route("/api/keyword-rules", createKeywordRulesRoutes(keywordRuleStore));
// ntfy 通知設定 (取得・保存・テスト送信)。
app.route(
  "/api/notification-settings",
  createNotificationSettingsRoutes(notificationSettingsStore, {
    sendTest: (target) =>
      sendNtfy(target, {
        title: "テスト通知",
        message: "mirakc-ui からのテスト通知です。",
        tags: ["bell"],
      }),
  }),
);

// --- 録画イベント通知 ---
// mirakc の /events (SSE) を購読し、録画開始/終了を ntfy へ通知する。
// 設定はイベントごとに KV から読み直すため、保存後の反映に再起動は不要。
{
  const mirakcUrl = Deno.env.get("MIRAKC_URL");
  if (mirakcUrl) {
    const apiUrl = mirakcApiUrlOf(mirakcUrl);
    subscribeMirakcEvents({
      eventsUrl: mirakcEventsUrlOf(mirakcUrl),
      onEvent: async (event) => {
        const recording = recordingEventOf(event);
        if (recording === null) {
          return;
        }
        const settings = await notificationSettingsStore.get();
        const enabled = recording.kind === "started"
          ? settings.onStart
          : settings.onEnd;
        if (!enabled || !isValidNtfyUrl(settings.url)) {
          return;
        }
        await notifyRecordingEvent({
          apiUrl,
          notify: (notification) =>
            sendNtfy(
              { url: settings.url, token: settings.token },
              notification,
            ),
        }, recording);
      },
    });
  } else {
    console.error(
      "[main] MIRAKC_URL is not set; recording notifications are disabled",
    );
  }
}

// --- 静的配信 (本番) ---
// Vite ビルド成果物 (client/dist) を配信する。開発時は Vite dev server が
// UI を担い、/api/* だけがこの Hono にプロキシされるため下記は実質本番専用。
app.use("/*", serveStatic({ root: "./client/dist" }));

// SPA フォールバック: 未知のパスは index.html を返してクライアントルーターに委ねる。
app.get("/*", serveStatic({ path: "./client/dist/index.html" }));

export default app;
