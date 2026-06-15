/**
 * Discord の Incoming Webhook への通知送信。
 *
 * 設定 (Webhook URL) は通知設定 (Deno KV) から渡される。Webhook URL へ embed を
 * JSON で POST するだけで、bot / token / Gateway は不要。ntfy (server/lib/ntfy.ts)
 * と対称な構成で、同じ NtfyNotification を受け取る。
 * https://discord.com/developers/docs/resources/webhook#execute-webhook
 */

import type { NtfyNotification } from "./ntfy.ts";
import { isValidDiscordWebhookUrl } from "./notification-settings.ts";

/** 通知の送信先。NotificationSettings のサブセット。 */
export type DiscordTarget = {
  /** Discord の Incoming Webhook URL。 */
  webhookUrl: string;
};

// Discord の embed の上限。超過すると 400 で送信失敗するため安全側で切り詰める。
// https://discord.com/developers/docs/resources/message#embed-object-embed-limits
const EMBED_TITLE_MAX = 256;
const EMBED_DESCRIPTION_MAX = 4096;

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`;
}

/**
 * 通知を送る。送信失敗・URL 不正は false を返すだけで throw しない
 * (通知失敗でイベント購読ループや API を止めないため)。
 *
 * ntfy と同じ NtfyNotification を受け、embed (title + description) として送る。
 * ntfy 専用の tags は使わない。color があれば embed の色に使う。
 */
export async function sendDiscord(
  target: DiscordTarget,
  notification: NtfyNotification,
  fetchFn: typeof fetch = fetch,
): Promise<boolean> {
  if (!isValidDiscordWebhookUrl(target.webhookUrl)) {
    console.error(`[discord] invalid webhook url: ${target.webhookUrl}`);
    return false;
  }

  const embed: Record<string, unknown> = {
    title: truncate(notification.title, EMBED_TITLE_MAX),
  };
  if (notification.message !== "") {
    embed.description = truncate(notification.message, EMBED_DESCRIPTION_MAX);
  }
  if (notification.color !== undefined) {
    embed.color = notification.color;
  }

  try {
    const res = await fetchFn(target.webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
    // Webhook は既定で 204 No Content を返す。res.ok で成否を判定する。
    if (!res.ok) {
      console.error(
        `[discord] publish failed: ${res.status} ${res.statusText}`,
      );
      await res.body?.cancel();
      return false;
    }
    await res.body?.cancel();
    return true;
  } catch (e) {
    console.error("[discord] publish failed:", e);
    return false;
  }
}
