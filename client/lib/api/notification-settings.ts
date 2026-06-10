/**
 * ntfy 通知設定 API (/api/notification-settings) のクライアント。
 *
 * mirakc-ui 自身の Hono が提供するため $api (mirakc の OpenAPI 由来) には
 * 含まれない。素の fetch を薄くラップし、型は
 * server/lib/notification-settings.ts から共有する。
 */
import type { NotificationSettings } from "../../../server/lib/notification-settings.ts";

export type { NotificationSettings };

const BASE_PATH = "/api/notification-settings";

async function ensureOk(res: Response): Promise<Response> {
  if (!res.ok) {
    await res.body?.cancel();
    throw new Error(`notification-settings api failed: ${res.status}`);
  }
  return res;
}

/** 設定を取得する (未保存なら既定値が返る)。 */
export async function fetchNotificationSettings(
  fetchFn: typeof fetch = fetch,
): Promise<NotificationSettings> {
  const res = await ensureOk(await fetchFn(BASE_PATH));
  return await res.json();
}

/** 設定を保存する (全上書き)。 */
export async function saveNotificationSettings(
  settings: NotificationSettings,
  fetchFn: typeof fetch = fetch,
): Promise<NotificationSettings> {
  const res = await ensureOk(
    await fetchFn(BASE_PATH, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(settings),
    }),
  );
  return await res.json();
}

/** 入力中の url / token でテスト通知を送る。失敗は throw。 */
export async function sendTestNotification(
  target: { url: string; token: string },
  fetchFn: typeof fetch = fetch,
): Promise<void> {
  const res = await ensureOk(
    await fetchFn(`${BASE_PATH}/test`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(target),
    }),
  );
  await res.body?.cancel();
}
