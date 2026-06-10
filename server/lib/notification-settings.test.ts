import { assertEquals } from "@std/assert";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  isNotificationSettings,
  isValidNtfyUrl,
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

Deno.test("isNotificationSettings: 型ガード", () => {
  assertEquals(isNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS), true);
  assertEquals(
    isNotificationSettings({
      url: "https://ntfy.sh/x",
      token: "tk",
      onStart: true,
      onEnd: false,
    }),
    true,
  );
  assertEquals(isNotificationSettings(null), false);
  assertEquals(isNotificationSettings({}), false);
  assertEquals(
    isNotificationSettings({ url: 1, token: "", onStart: true, onEnd: true }),
    false,
  );
});

Deno.test("parse: 正常系は trim と既定値を適用する", () => {
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
      onStart: true,
      onEnd: false,
    },
  });
});

Deno.test("parse: 両イベント OFF なら url 空でも保存できる", () => {
  const result = parseNotificationSettingsInput({
    url: "",
    token: "",
    onStart: false,
    onEnd: false,
  });
  assertEquals(result.ok, true);
});

Deno.test("parse: イベントが有効なら url 必須", () => {
  const result = parseNotificationSettingsInput({
    url: "",
    token: "",
    onStart: true,
    onEnd: false,
  });
  assertEquals(result.ok, false);
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
    { url: 1, token: "", onStart: false, onEnd: false },
    { url: "", token: 1, onStart: false, onEnd: false },
    { url: "", token: "", onStart: "yes", onEnd: false },
    { url: "", token: "", onStart: false },
  ];
  for (const value of invalid) {
    assertEquals(
      parseNotificationSettingsInput(value).ok,
      false,
      JSON.stringify(value),
    );
  }
});
