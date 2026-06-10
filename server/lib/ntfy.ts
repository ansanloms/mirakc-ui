/**
 * ntfy (https://ntfy.sh / セルフホスト) への通知送信。
 *
 * 設定 (トピックまで含む URL + 任意のトークン) は通知設定 (Deno KV) から
 * 渡される。日本語タイトルを HTTP ヘッダに載せられない (ヘッダは latin-1
 * 制約) ため、URL を base とトピックに分解し、base へ JSON body を POST
 * する "JSON publishing" 方式を使う。
 * https://docs.ntfy.sh/publish/#publish-as-json
 */

import { splitNtfyUrl } from "./notification-settings.ts";

/** 通知の送信先。NotificationSettings のサブセット。 */
export type NtfyTarget = {
  /** トピックまで含む ntfy の URL。 */
  url: string;

  /** アクセストークン。空なら認証ヘッダを付けない。 */
  token: string;
};

export type NtfyNotification = {
  title: string;
  message: string;

  /** ntfy の tags (emoji shortcode 等)。 */
  tags?: string[];
};

/**
 * 通知を送る。送信失敗・URL 不正は false を返すだけで throw しない
 * (通知失敗でイベント購読ループや API を止めないため)。
 */
export async function sendNtfy(
  target: NtfyTarget,
  notification: NtfyNotification,
  fetchFn: typeof fetch = fetch,
): Promise<boolean> {
  const split = splitNtfyUrl(target.url);
  if (split === null) {
    console.error(`[ntfy] invalid ntfy url: ${target.url}`);
    return false;
  }

  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (target.token !== "") {
    headers["authorization"] = `Bearer ${target.token}`;
  }

  try {
    const res = await fetchFn(split.base, {
      method: "POST",
      headers,
      body: JSON.stringify({
        topic: split.topic,
        title: notification.title,
        message: notification.message,
        ...(notification.tags ? { tags: notification.tags } : {}),
      }),
    });
    if (!res.ok) {
      console.error(`[ntfy] publish failed: ${res.status} ${res.statusText}`);
      await res.body?.cancel();
      return false;
    }
    await res.body?.cancel();
    return true;
  } catch (e) {
    console.error("[ntfy] publish failed:", e);
    return false;
  }
}
