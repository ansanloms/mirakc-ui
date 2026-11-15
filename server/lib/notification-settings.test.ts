import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  hasEnabledDestination,
  isValidDiscordWebhookUrl,
  isValidNtfyUrl,
  normalizeNotificationSettings,
  type NotificationSettings,
  parseNotificationSettingsInput,
  splitNtfyUrl,
} from "./notification-settings.ts";

test("isValidNtfyUrl: http(s) + 非空トピックのみ true", () => {
  assert.deepStrictEqual(isValidNtfyUrl("https://ntfy.sh/mirakc-rec"), true);
  assert.deepStrictEqual(isValidNtfyUrl("http://ntfy.example.com/topic"), true);
  // セルフホストのサブパス配下も許容する。
  assert.deepStrictEqual(
    isValidNtfyUrl("https://example.com/ntfy/topic"),
    true,
  );

  assert.deepStrictEqual(isValidNtfyUrl(""), false);
  assert.deepStrictEqual(isValidNtfyUrl("ntfy.sh/topic"), false);
  assert.deepStrictEqual(isValidNtfyUrl("ftp://ntfy.sh/topic"), false);
  // トピックなし。
  assert.deepStrictEqual(isValidNtfyUrl("https://ntfy.sh"), false);
  assert.deepStrictEqual(isValidNtfyUrl("https://ntfy.sh/"), false);
});

test("splitNtfyUrl: 最終セグメントを topic、残りを base に分解", () => {
  assert.deepStrictEqual(splitNtfyUrl("https://ntfy.sh/mirakc-rec"), {
    base: "https://ntfy.sh",
    topic: "mirakc-rec",
  });
  assert.deepStrictEqual(splitNtfyUrl("https://example.com/ntfy/topic"), {
    base: "https://example.com/ntfy",
    topic: "topic",
  });
  assert.deepStrictEqual(splitNtfyUrl("https://ntfy.sh/topic/"), {
    base: "https://ntfy.sh",
    topic: "topic",
  });
  assert.deepStrictEqual(splitNtfyUrl("https://ntfy.sh"), null);
  assert.deepStrictEqual(splitNtfyUrl("not a url"), null);
});

test("normalize: 新形状はそのまま通す", () => {
  const settings = {
    url: "https://ntfy.sh/x",
    token: "tk",
    discordWebhookUrl: "https://discord.com/api/webhooks/123/abc",
    onSchedule: true,
    onStart: true,
    onEnd: false,
    onFail: true,
    onRemove: false,
  };
  assert.deepStrictEqual(normalizeNotificationSettings(settings), settings);
});

test("normalize: 旧形状 (onStart/onEnd のみ) は新トグルを false 補完", () => {
  assert.deepStrictEqual(
    normalizeNotificationSettings({
      url: "https://ntfy.sh/x",
      token: "tk",
      onStart: true,
      onEnd: false,
    }),
    {
      url: "https://ntfy.sh/x",
      token: "tk",
      discordWebhookUrl: "",
      onSchedule: false,
      onStart: true,
      onEnd: false,
      onFail: false,
      onRemove: false,
    },
  );
});

test("normalize: Discord 追加前の旧形状は discordWebhookUrl を空で補完", () => {
  const result = normalizeNotificationSettings({
    url: "https://ntfy.sh/x",
    token: "tk",
    onSchedule: false,
    onStart: false,
    onEnd: false,
    onFail: false,
    onRemove: false,
  });
  assert.deepStrictEqual(result?.discordWebhookUrl, "");
});

test("normalize: 不正な形は null", () => {
  assert.deepStrictEqual(normalizeNotificationSettings(null), null);
  assert.deepStrictEqual(normalizeNotificationSettings({}), null);
  assert.deepStrictEqual(
    normalizeNotificationSettings({ url: 1, token: "" }),
    null,
  );
  assert.deepStrictEqual(
    normalizeNotificationSettings({ url: "", token: "", onStart: "yes" }),
    null,
  );
  // discordWebhookUrl が string 以外なら null。
  assert.deepStrictEqual(
    normalizeNotificationSettings({ url: "", token: "", discordWebhookUrl: 1 }),
    null,
  );
});

test("parse: 正常系は trim と既定値 (未指定トグル false) を適用する", () => {
  const result = parseNotificationSettingsInput({
    url: " https://ntfy.sh/mirakc-rec ",
    token: " tk_abc ",
    onStart: true,
    onEnd: false,
  });
  assert.deepStrictEqual(result, {
    ok: true,
    input: {
      url: "https://ntfy.sh/mirakc-rec",
      token: "tk_abc",
      discordWebhookUrl: "",
      onSchedule: false,
      onStart: true,
      onEnd: false,
      onFail: false,
      onRemove: false,
    },
  });
});

test("parse: 全イベント OFF なら url 空でも保存できる", () => {
  const result = parseNotificationSettingsInput({
    url: "",
    token: "",
    onSchedule: false,
    onStart: false,
    onEnd: false,
    onFail: false,
    onRemove: false,
  });
  assert.deepStrictEqual(result.ok, true);
});

test("parse: いずれかのイベントが有効なら url 必須", () => {
  for (
    const key of ["onSchedule", "onStart", "onEnd", "onFail", "onRemove"]
  ) {
    const result = parseNotificationSettingsInput({
      url: "",
      token: "",
      [key]: true,
    });
    assert.deepStrictEqual(result.ok, false, key);
  }
});

test("parse: url が非空なら OFF でも形式を検証する", () => {
  const result = parseNotificationSettingsInput({
    url: "not a url",
    token: "",
    onStart: false,
    onEnd: false,
  });
  assert.deepStrictEqual(result.ok, false);
});

test("parse: 不正な型は ok:false", () => {
  const invalid: unknown[] = [
    null,
    {},
    { url: 1, token: "" },
    { url: "", token: 1 },
    { url: "", token: "", onStart: "yes" },
    { url: "", token: "", onFail: 1 },
  ];
  for (const value of invalid) {
    assert.deepStrictEqual(
      parseNotificationSettingsInput(value).ok,
      false,
      JSON.stringify(value),
    );
  }

  assert.deepStrictEqual(
    DEFAULT_NOTIFICATION_SETTINGS.onSchedule,
    false,
  );
  assert.deepStrictEqual(DEFAULT_NOTIFICATION_SETTINGS.discordWebhookUrl, "");
});

test("isValidDiscordWebhookUrl: discord(app).com の webhook 形式のみ true", () => {
  assert.deepStrictEqual(
    isValidDiscordWebhookUrl("https://discord.com/api/webhooks/123/abc-DEF_0"),
    true,
  );
  assert.deepStrictEqual(
    isValidDiscordWebhookUrl(
      "https://discordapp.com/api/webhooks/123456789/tok",
    ),
    true,
  );
  // API バージョン付き、サブドメイン (canary / ptb)、末尾スラッシュも許容する。
  assert.deepStrictEqual(
    isValidDiscordWebhookUrl("https://discord.com/api/v10/webhooks/1/tok"),
    true,
  );
  assert.deepStrictEqual(
    isValidDiscordWebhookUrl("https://canary.discord.com/api/webhooks/1/tok/"),
    true,
  );

  assert.deepStrictEqual(isValidDiscordWebhookUrl(""), false);
  // http は不可 (Discord は https のみ)。
  assert.deepStrictEqual(
    isValidDiscordWebhookUrl("http://discord.com/api/webhooks/1/tok"),
    false,
  );
  // 別ホスト。
  assert.deepStrictEqual(
    isValidDiscordWebhookUrl("https://example.com/api/webhooks/1/tok"),
    false,
  );
  // token 欠落。
  assert.deepStrictEqual(
    isValidDiscordWebhookUrl("https://discord.com/api/webhooks/123"),
    false,
  );
  // id が数値でない。
  assert.deepStrictEqual(
    isValidDiscordWebhookUrl("https://discord.com/api/webhooks/abc/tok"),
    false,
  );
});

test("parse: Discord Webhook だけでも (ntfy 空でも) 保存できる", () => {
  const result = parseNotificationSettingsInput({
    url: "",
    token: "",
    discordWebhookUrl: " https://discord.com/api/webhooks/123/abc ",
    onStart: true,
  });
  assert.deepStrictEqual(result, {
    ok: true,
    input: {
      url: "",
      token: "",
      discordWebhookUrl: "https://discord.com/api/webhooks/123/abc",
      onSchedule: false,
      onStart: true,
      onEnd: false,
      onFail: false,
      onRemove: false,
    },
  });
});

test("parse: イベント有効で通知先がゼロ (ntfy も Discord も空) ならエラー", () => {
  const result = parseNotificationSettingsInput({
    url: "",
    token: "",
    discordWebhookUrl: "",
    onFail: true,
  });
  assert.deepStrictEqual(result.ok, false);
});

test("parse: discordWebhookUrl が非空なら形式を検証する", () => {
  const result = parseNotificationSettingsInput({
    url: "",
    token: "",
    discordWebhookUrl: "https://example.com/not-a-webhook",
    onStart: false,
  });
  assert.deepStrictEqual(result.ok, false);
});

test("hasEnabledDestination: トグル ON かつ妥当な通知先が 1 つ以上で true", () => {
  const base: NotificationSettings = {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    onFail: true,
  };
  // 通知先が無ければ false。
  assert.deepStrictEqual(hasEnabledDestination(base, "onFail"), false);
  // ntfy のみ。
  assert.deepStrictEqual(
    hasEnabledDestination({ ...base, url: "https://ntfy.sh/x" }, "onFail"),
    true,
  );
  // Discord のみ。
  assert.deepStrictEqual(
    hasEnabledDestination(
      { ...base, discordWebhookUrl: "https://discord.com/api/webhooks/1/tok" },
      "onFail",
    ),
    true,
  );
  // トグル OFF なら通知先があっても false。
  assert.deepStrictEqual(
    hasEnabledDestination({ ...base, url: "https://ntfy.sh/x" }, "onStart"),
    false,
  );
});
