import { Hono } from "hono";
import {
  isValidNtfyUrl,
  type NotificationSettings,
  parseNotificationSettingsInput,
} from "../lib/notification-settings.ts";
import type { NtfyTarget } from "../lib/ntfy.ts";

/**
 * ルートが必要とするストア操作。NotificationSettingsStore のサブセット
 * (テストでフェイクに差し替えられるよう構造的に定義する)。
 */
export type NotificationSettingsStoreLike = {
  get(): Promise<NotificationSettings>;
  set(settings: NotificationSettings): Promise<NotificationSettings>;
};

/** テスト送信の実体 (sendNtfy のラッパー) を注入する。 */
export type NotificationTestSender = {
  sendTest(target: NtfyTarget): Promise<boolean>;
};

/**
 * ntfy 通知設定の API。`/api/notification-settings` にマウントする。
 *
 * - GET  /      設定 (未保存なら既定値)。token も平文で返す — フォームの
 *               初期値に必要なため。LAN 内の個人用アプリ前提で許容する
 * - PUT  /      設定の全上書き保存
 * - POST /test  テスト通知の送信。body は保存前の draft (url / token) を
 *               受け、実際に ntfy へ送る。失敗は 502
 */
export function createNotificationSettingsRoutes(
  store: NotificationSettingsStoreLike,
  sender: NotificationTestSender,
): Hono {
  const app = new Hono();

  app.get("/", async (c) => {
    return c.json(await store.get());
  });

  app.put("/", async (c) => {
    let parsed: ReturnType<typeof parseNotificationSettingsInput>;
    try {
      parsed = parseNotificationSettingsInput(await c.req.json());
    } catch {
      parsed = { ok: false, error: "invalid JSON body" };
    }
    if (!parsed.ok) {
      return c.json({ error: parsed.error }, 400);
    }
    return c.json(await store.set(parsed.input));
  });

  app.post("/test", async (c) => {
    let body: Record<string, unknown>;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "invalid JSON body" }, 400);
    }
    const url = typeof body.url === "string" ? body.url.trim() : "";
    const token = typeof body.token === "string" ? body.token.trim() : "";
    if (!isValidNtfyUrl(url)) {
      return c.json({ error: "url must be a http(s) URL with a topic" }, 400);
    }

    const ok = await sender.sendTest({ url, token });
    if (!ok) {
      return c.json({ error: "failed to send test notification" }, 502);
    }
    return c.json({ ok: true });
  });

  return app;
}
