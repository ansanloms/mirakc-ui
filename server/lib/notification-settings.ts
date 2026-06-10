/**
 * ntfy 通知設定の型・バリデーション・URL ヘルパ。
 *
 * Deno API に依存しない純粋モジュールで、server (API・通知送信) と
 * client (フォーム検証・テストボタン活性判定) の両方から runtime import
 * される (server/lib/keyword-rules.ts と同じ共有パターン)。永続化は
 * server/store/notification-settings.ts (Deno KV) が担う。
 */

/**
 * 通知イベントのトグルキー (表示順)。
 * 録画登録 → 開始 → 終了 → 失敗 → 削除。
 */
export const NOTIFICATION_EVENT_KEYS = [
  "onSchedule",
  "onStart",
  "onEnd",
  "onFail",
  "onRemove",
] as const;

export type NotificationEventKey = (typeof NOTIFICATION_EVENT_KEYS)[number];

/** ntfy 通知設定。 */
export type NotificationSettings = {
  /** トピックまで含む ntfy の URL (例: https://ntfy.sh/mirakc-rec)。 */
  url: string;

  /** アクセストークン (任意)。Authorization: Bearer で送信する。 */
  token: string;

  /** 録画予約の登録 (キーワード自動録画 / 手動) を通知する。 */
  onSchedule: boolean;

  /** 録画開始 (recording.started) を通知する。 */
  onStart: boolean;

  /** 録画終了 (recording.stopped) を通知する。 */
  onEnd: boolean;

  /** 録画失敗 (recording.failed) を通知する。 */
  onFail: boolean;

  /** 録画予約の削除を通知する。 */
  onRemove: boolean;
};

/** 未保存時の既定値。通知はすべて無効。 */
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  url: "",
  token: "",
  onSchedule: false,
  onStart: false,
  onEnd: false,
  onFail: false,
  onRemove: false,
};

/**
 * KV 等から読んだ値を正規化する。トグル追加前の旧形状 (onStart / onEnd
 * のみ) は新トグルを false で補完し、保存済み設定を壊さない。
 * 形が不正なら null。
 */
export function normalizeNotificationSettings(
  value: unknown,
): NotificationSettings | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }
  const settings = value as Record<string, unknown>;
  if (
    typeof settings.url !== "string" || typeof settings.token !== "string"
  ) {
    return null;
  }
  for (const key of NOTIFICATION_EVENT_KEYS) {
    if (settings[key] !== undefined && typeof settings[key] !== "boolean") {
      return null;
    }
  }
  return {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    url: settings.url,
    token: settings.token,
    ...Object.fromEntries(
      NOTIFICATION_EVENT_KEYS
        .filter((key) => typeof settings[key] === "boolean")
        .map((key) => [key, settings[key]]),
    ),
  };
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
 * API 入力をバリデーションして正規化する。url / token は trim、トグルは
 * 未指定なら false。イベントが 1 つでも有効なら url 必須。url が非空なら
 * (イベントがすべて無効でも) 形式を検証し、壊れた URL の保存を防ぐ。
 */
export function parseNotificationSettingsInput(value: unknown): ParseResult {
  if (typeof value !== "object" || value === null) {
    return { ok: false, error: "body must be an object" };
  }
  const body = value as Record<string, unknown>;

  if (typeof body.url !== "string" || typeof body.token !== "string") {
    return { ok: false, error: "url and token must be strings" };
  }
  for (const key of NOTIFICATION_EVENT_KEYS) {
    if (body[key] !== undefined && typeof body[key] !== "boolean") {
      return { ok: false, error: `${key} must be a boolean` };
    }
  }
  const toggles = Object.fromEntries(
    NOTIFICATION_EVENT_KEYS.map((key) => [key, body[key] === true]),
  ) as Record<NotificationEventKey, boolean>;

  const url = body.url.trim();
  const anyEvent = NOTIFICATION_EVENT_KEYS.some((key) => toggles[key]);
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
      ...toggles,
    },
  };
}
