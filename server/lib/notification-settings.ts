/**
 * ntfy 通知設定の型・バリデーション・URL ヘルパ。
 *
 * Deno API に依存しない純粋モジュールで、server (API・通知送信) と
 * client (フォーム検証・テストボタン活性判定) の両方から runtime import
 * される (server/lib/keyword-rules.ts と同じ共有パターン)。永続化は
 * notification-settings-store.ts (Deno KV) が担う。
 */

/** ntfy 通知設定。 */
export type NotificationSettings = {
  /** トピックまで含む ntfy の URL (例: https://ntfy.sh/mirakc-rec)。 */
  url: string;

  /** アクセストークン (任意)。Authorization: Bearer で送信する。 */
  token: string;

  /** 録画開始 (recording.started) を通知する。 */
  onStart: boolean;

  /** 録画終了 (recording.stopped) を通知する。 */
  onEnd: boolean;
};

/** 未保存時の既定値。通知はすべて無効。 */
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  url: "",
  token: "",
  onStart: false,
  onEnd: false,
};

/** KV から読んだ値のバリデーション用の型ガード。 */
export function isNotificationSettings(
  value: unknown,
): value is NotificationSettings {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const settings = value as Record<string, unknown>;
  return typeof settings.url === "string" &&
    typeof settings.token === "string" &&
    typeof settings.onStart === "boolean" &&
    typeof settings.onEnd === "boolean";
}

/**
 * ntfy のトピック URL を base とトピックに分解する (JSON publishing は
 * base へ POST し、body にトピックを載せるため)。分解できなければ null。
 */
export function splitNtfyUrl(
  url: string,
): { base: string; topic: string } | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return null;
  }

  const segments = parsed.pathname.split("/").filter((s) => s !== "");
  const topic = segments.pop();
  if (topic === undefined) {
    return null;
  }
  const basePath = segments.length > 0 ? `/${segments.join("/")}` : "";
  return { base: `${parsed.origin}${basePath}`, topic };
}

/** http(s) かつトピック (非空の最終 path セグメント) を持つ URL か。 */
export function isValidNtfyUrl(url: string): boolean {
  return splitNtfyUrl(url) !== null;
}

export type ParseResult =
  | { ok: true; input: NotificationSettings }
  | { ok: false; error: string };

/**
 * API 入力をバリデーションして正規化する。url / token は trim。
 * イベントが 1 つでも有効なら url 必須。url が非空なら (イベントが
 * すべて無効でも) 形式を検証し、壊れた URL の保存を防ぐ。
 */
export function parseNotificationSettingsInput(value: unknown): ParseResult {
  if (typeof value !== "object" || value === null) {
    return { ok: false, error: "body must be an object" };
  }
  const body = value as Record<string, unknown>;

  if (typeof body.url !== "string" || typeof body.token !== "string") {
    return { ok: false, error: "url and token must be strings" };
  }
  if (typeof body.onStart !== "boolean" || typeof body.onEnd !== "boolean") {
    return { ok: false, error: "onStart and onEnd must be booleans" };
  }

  const url = body.url.trim();
  const anyEvent = body.onStart || body.onEnd;
  if (anyEvent && url === "") {
    return { ok: false, error: "url is required when notification is enabled" };
  }
  if (url !== "" && !isValidNtfyUrl(url)) {
    return { ok: false, error: "url must be a http(s) URL with a topic" };
  }

  return {
    ok: true,
    input: {
      url,
      token: body.token.trim(),
      onStart: body.onStart,
      onEnd: body.onEnd,
    },
  };
}
