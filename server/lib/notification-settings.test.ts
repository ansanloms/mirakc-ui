import { assertEquals } from "@std/assert";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  isValidNtfyUrl,
  normalizeNotificationSettings,
  parseNotificationSettingsInput,
  splitNtfyUrl,
} from "./notification-settings.ts";

Deno.test("isValidNtfyUrl: http(s) + 非空トピックのみ true", () => {
  assertEquals(isValidNtfyUrl("https://ntfy.sh/mirakc-rec"), true);
  assertEquals(isValidNtfyUrl("http://ntfy.example.com/topic"), true);
  // セルフホストのサブパス配下も許容する。
  assertEquals(isValidNtfyUrl("https://example.com/ntfy/topic"), true);

  assertEquals(isValidNtfyUrl(""), false);
  assertEquals(isValidNtfyUrl("ntfy.sh/topic"), false);
  assertEquals(isValidNtfyUrl("ftp://ntfy.sh/topic"), false);
  // トピックなし。
  assertEquals(isValidNtfyUrl("https://ntfy.sh"), false);
  assertEquals(isValidNtfyUrl("https://ntfy.sh/"), false);
});

Deno.test("splitNtfyUrl: 最終セグメントを topic、残りを base に分解", () => {
  assertEquals(splitNtfyUrl("https://ntfy.sh/mirakc-rec"), {
    base: "https://ntfy.sh",
    topic: "mirakc-rec",
  });
  assertEquals(splitNtfyUrl("https://example.com/ntfy/topic"), {
    base: "https://example.com/ntfy",
    topic: "topic",
  });
  assertEquals(splitNtfyUrl("https://ntfy.sh/topic/"), {
    base: "https://ntfy.sh",
    topic: "topic",
  });
  assertEquals(splitNtfyUrl("https://ntfy.sh"), null);
  assertEquals(splitNtfyUrl("not a url"), null);
});

Deno.test("normalize: 新形状はそのまま通す", () => {
  const settings = {
    url: "https://ntfy.sh/x",
    token: "tk",
    onSchedule: true,
    onStart: true,
    onEnd: false,
    onFail: true,
    onRemove: false,
  };
  assertEquals(normalizeNotificationSettings(settings), settings);
});

Deno.test("normalize: 旧形状 (onStart/onEnd のみ) は新トグルを false 補完", () => {
  assertEquals(
    normalizeNotificationSettings({
      url: "https://ntfy.sh/x",
      token: "tk",
      onStart: true,
      onEnd: false,
    }),
    {
      url: "https://ntfy.sh/x",
      token: "tk",
      onSchedule: false,
      onStart: true,
      onEnd: false,
      onFail: false,
      onRemove: false,
    },
  );
});

Deno.test("normalize: 不正な形は null", () => {
  assertEquals(normalizeNotificationSettings(null), null);
  assertEquals(normalizeNotificationSettings({}), null);
  assertEquals(
    normalizeNotificationSettings({ url: 1, token: "" }),
    null,
  );
  assertEquals(
    normalizeNotificationSettings({ url: "", token: "", onStart: "yes" }),
    null,
  );
});

Deno.test("parse: 正常系は trim と既定値 (未指定トグル false) を適用する", () => {
  const result = parseNotificationSettingsInput({
    url: " https://ntfy.sh/mirakc-rec ",
    token: " tk_abc ",
    onStart: true,
    onEnd: false,
  });
  assertEquals(result, {
    ok: true,
    input: {
      url: "https://ntfy.sh/mirakc-rec",
      token: "tk_abc",
      onSchedule: false,
      onStart: true,
      onEnd: false,
      onFail: false,
      onRemove: false,
    },
  });
});

Deno.test("parse: 全イベント OFF なら url 空でも保存できる", () => {
  const result = parseNotificationSettingsInput({
    url: "",
    token: "",
    onSchedule: false,
    onStart: false,
    onEnd: false,
    onFail: false,
    onRemove: false,
  });
  assertEquals(result.ok, true);
});

Deno.test("parse: いずれかのイベントが有効なら url 必須", () => {
  for (
    const key of ["onSchedule", "onStart", "onEnd", "onFail", "onRemove"]
  ) {
    const result = parseNotificationSettingsInput({
      url: "",
      token: "",
      [key]: true,
    });
    assertEquals(result.ok, false, key);
  }
});

Deno.test("parse: url が非空なら OFF でも形式を検証する", () => {
  const result = parseNotificationSettingsInput({
    url: "not a url",
    token: "",
    onStart: false,
    onEnd: false,
  });
  assertEquals(result.ok, false);
});

Deno.test("parse: 不正な型は ok:false", () => {
  const invalid: unknown[] = [
    null,
    {},
    { url: 1, token: "" },
    { url: "", token: 1 },
    { url: "", token: "", onStart: "yes" },
    { url: "", token: "", onFail: 1 },
  ];
  for (const value of invalid) {
    assertEquals(
      parseNotificationSettingsInput(value).ok,
      false,
      JSON.stringify(value),
    );
  }

  assertEquals(
    DEFAULT_NOTIFICATION_SETTINGS.onSchedule,
    false,
  );
});
