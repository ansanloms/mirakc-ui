/**
 * ntfy / Discord 通知設定の型・バリデーション・URL ヘルパ。
 *
 * Deno API に依存しない純粋モジュールで、server (API・通知送信) と
 * client (フォーム検証・テストボタン活性判定) の両方から runtime import
 * される (server/lib/keyword-rules.ts と同じ共有パターン)。永続化は
 * server/store/notification-settings.ts (Deno KV) が担う。
 */
import type { FromSchema } from "json-schema-to-ts";
import { internalSchemas } from "./api/internal-schemas.ts";
import { matchesSchema, schemaErrorOf } from "./api/validate.ts";

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

/**
 * 通知設定。docs/api の OpenAPI から生成した component schema
 * (internal-schemas.ts) を型の単一ソースとする。通知先 (ntfy の url / token、
 * Discord の discordWebhookUrl) と onSchedule / onStart / onEnd / onFail /
 * onRemove のトグルを持つ。トグルは通知先で共有し、ON のイベントを設定済みの
 * 全通知先へ送る。
 */
export type NotificationSettings = FromSchema<
  typeof internalSchemas["NotificationSettings"]
>;

/** 未保存時の既定値。通知はすべて無効。 */
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  url: "",
  token: "",
  discordWebhookUrl: "",
  onSchedule: false,
  onStart: false,
  onEnd: false,
  onFail: false,
  onRemove: false,
};

/**
 * KV 等から読んだ値を正規化する。トグル追加前 (onStart / onEnd のみ) や
 * Discord 追加前 (discordWebhookUrl 無し) の旧形状は既定値で補完し、保存済み
 * 設定を壊さない。形が不正なら null。
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
  if (
    settings.discordWebhookUrl !== undefined &&
    typeof settings.discordWebhookUrl !== "string"
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
    discordWebhookUrl: typeof settings.discordWebhookUrl === "string"
      ? settings.discordWebhookUrl
      : "",
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

/**
 * Discord の Incoming Webhook URL か。`https` かつ host が discord(app).com 系
 * (ptb. / canary. サブドメイン含む)、path が `/api[/vN]/webhooks/{id}/{token}`
 * 形式かを緩く判定する。投稿は POST するだけなので厳密検証はせず、明らかな
 * 誤入力 (別サービスの URL・トピック欠落) の保存を防ぐ程度に留める。
 */
export function isValidDiscordWebhookUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") {
    return false;
  }
  const host = parsed.hostname;
  const hostOk = host === "discord.com" || host === "discordapp.com" ||
    host.endsWith(".discord.com") || host.endsWith(".discordapp.com");
  if (!hostOk) {
    return false;
  }
  const path = parsed.pathname.replace(/\/$/, "");
  return /^\/api(?:\/v\d+)?\/webhooks\/\d+\/[\w-]+$/.test(path);
}

/**
 * イベント `key` のトグルが有効で、かつ送信できる通知先 (妥当な ntfy URL か
 * Discord Webhook URL) が少なくとも 1 つあるか。送信側 (notifyIfEnabled・SSE
 * ハンドラ) の発火判定を 1 箇所に集約する。
 */
export function hasEnabledDestination(
  settings: NotificationSettings,
  key: NotificationEventKey,
): boolean {
  return settings[key] &&
    (isValidNtfyUrl(settings.url) ||
      isValidDiscordWebhookUrl(settings.discordWebhookUrl));
}

export type ParseResult =
  | { ok: true; input: NotificationSettings }
  | { ok: false; error: string };

/** value が NotificationSettings スキーマに適合するかを判定する型ガード。 */
function isNotificationSettings(value: unknown): value is NotificationSettings {
  return matchesSchema("NotificationSettings", value);
}

/**
 * API 入力をバリデーションして正規化する。url / token / discordWebhookUrl は
 * trim、トグルは未指定なら false。イベントが 1 つでも有効なら通知先 (ntfy URL
 * か Discord Webhook) が少なくとも 1 つ必須。各 URL は非空なら (イベントがすべて
 * 無効でも) 形式を検証し、壊れた URL の保存を防ぐ。
 */
export function parseNotificationSettingsInput(value: unknown): ParseResult {
  // OpenAPI スキーマは全トグルと discordWebhookUrl を required にしているため、
  // 未指定のトグルを false、discordWebhookUrl を "" で補ってから構造検証する
  // (未指定は無効という既定の挙動を保つ)。
  let candidate: unknown = value;
  if (typeof value === "object" && value !== null) {
    const copy: Record<string, unknown> = { ...value };
    for (const key of NOTIFICATION_EVENT_KEYS) {
      if (copy[key] === undefined) {
        copy[key] = false;
      }
    }
    if (copy.discordWebhookUrl === undefined) {
      copy.discordWebhookUrl = "";
    }
    candidate = copy;
  }

  if (!isNotificationSettings(candidate)) {
    return {
      ok: false,
      error: schemaErrorOf("NotificationSettings", candidate),
    };
  }

  const url = candidate.url.trim();
  const discordWebhookUrl = candidate.discordWebhookUrl.trim();
  const anyEvent = NOTIFICATION_EVENT_KEYS.some((key) => candidate[key]);
  if (anyEvent && url === "" && discordWebhookUrl === "") {
    return {
      ok: false,
      error:
        "a destination (ntfy url or discord webhook) is required when notification is enabled",
    };
  }
  if (url !== "" && !isValidNtfyUrl(url)) {
    return { ok: false, error: "url must be a http(s) URL with a topic" };
  }
  if (
    discordWebhookUrl !== "" && !isValidDiscordWebhookUrl(discordWebhookUrl)
  ) {
    return {
      ok: false,
      error: "discordWebhookUrl must be a Discord webhook URL",
    };
  }

  return {
    ok: true,
    input: {
      url,
      token: candidate.token.trim(),
      discordWebhookUrl,
      onSchedule: candidate.onSchedule,
      onStart: candidate.onStart,
      onEnd: candidate.onEnd,
      onFail: candidate.onFail,
      onRemove: candidate.onRemove,
    },
  };
}
