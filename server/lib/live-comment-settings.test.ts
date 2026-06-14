import { assertEquals } from "@std/assert";
import {
  isValidChannelId,
  normalizeLiveCommentSettings,
  parseLiveCommentSettingsInput,
} from "./live-comment-settings.ts";

Deno.test("isValidChannelId: 取得元ごとに ID 形式が違う", () => {
  assertEquals(isValidChannelId("nicolive", "ch2646436"), true);
  assertEquals(isValidChannelId("nicolive", "jk1"), false);
  assertEquals(isValidChannelId("nx-jikkyo", "jk1"), true);
  assertEquals(isValidChannelId("nx-jikkyo", "jk211"), true);
  assertEquals(isValidChannelId("nx-jikkyo", "ch2646436"), false);
  assertEquals(isValidChannelId("nicolive", ""), false);
  assertEquals(isValidChannelId("nx-jikkyo", "jk"), false);
});

Deno.test("parseLiveCommentSettingsInput: 取得元ごとの割り当てを受理し trim する", () => {
  const parsed = parseLiveCommentSettingsInput({
    nicolive: [{ serviceId: 3273601024, channelId: " ch2646436 " }],
    "nx-jikkyo": [{ serviceId: 3273601024, channelId: "jk1" }],
  });
  assertEquals(parsed, {
    ok: true,
    input: {
      nicolive: [{
        serviceId: 3273601024,
        channelId: "ch2646436",
        enabled: true,
      }],
      "nx-jikkyo": [{ serviceId: 3273601024, channelId: "jk1", enabled: true }],
    },
  });
});

Deno.test("parseLiveCommentSettingsInput: enabled 省略時は true", () => {
  const parsed = parseLiveCommentSettingsInput({
    nicolive: [{ serviceId: 1, channelId: "ch1" }],
  });
  assertEquals(parsed, {
    ok: true,
    input: {
      nicolive: [{ serviceId: 1, channelId: "ch1", enabled: true }],
      "nx-jikkyo": [],
    },
  });
});

Deno.test("parseLiveCommentSettingsInput: enabled を保持する", () => {
  const parsed = parseLiveCommentSettingsInput({
    nicolive: [
      { serviceId: 1, channelId: "ch1", enabled: true },
      { serviceId: 2, channelId: "ch2", enabled: false },
    ],
  });
  assertEquals(parsed.ok, true);
  if (parsed.ok) {
    assertEquals(parsed.input.nicolive, [
      { serviceId: 1, channelId: "ch1", enabled: true },
      { serviceId: 2, channelId: "ch2", enabled: false },
    ]);
  }
});

Deno.test("parseLiveCommentSettingsInput: 無効行は channelId 空/不正でも通る", () => {
  const parsed = parseLiveCommentSettingsInput({
    nicolive: [
      { serviceId: 1, channelId: "", enabled: false },
      { serviceId: 2, channelId: "まだ未入力", enabled: false },
    ],
  });
  assertEquals(parsed.ok, true);
});

Deno.test("parseLiveCommentSettingsInput: 有効行は形式必須", () => {
  assertEquals(
    parseLiveCommentSettingsInput({
      nicolive: [{ serviceId: 1, channelId: "jk1", enabled: true }],
    }).ok,
    false,
  );
});

Deno.test("parseLiveCommentSettingsInput: 欠けた取得元は空配列で補完する", () => {
  assertEquals(parseLiveCommentSettingsInput({}), {
    ok: true,
    input: { nicolive: [], "nx-jikkyo": [] },
  });
});

Deno.test("parseLiveCommentSettingsInput: オブジェクトでなければエラー", () => {
  assertEquals(parseLiveCommentSettingsInput(null).ok, false);
  assertEquals(parseLiveCommentSettingsInput("x").ok, false);
});

Deno.test("parseLiveCommentSettingsInput: 取得元の値が配列でなければエラー", () => {
  assertEquals(parseLiveCommentSettingsInput({ nicolive: "x" }).ok, false);
});

Deno.test("parseLiveCommentSettingsInput: serviceId が整数でなければエラー", () => {
  assertEquals(
    parseLiveCommentSettingsInput({
      nicolive: [{ serviceId: "1", channelId: "ch1" }],
    }).ok,
    false,
  );
});

Deno.test("parseLiveCommentSettingsInput: serviceId 重複は有効・無効問わずエラー", () => {
  assertEquals(
    parseLiveCommentSettingsInput({
      nicolive: [
        { serviceId: 1, channelId: "ch1" },
        { serviceId: 1, channelId: "", enabled: false },
      ],
    }).ok,
    false,
  );
});

Deno.test("parseLiveCommentSettingsInput: channelId 重複は有効行同士のみエラー", () => {
  // 有効同士 → エラー
  assertEquals(
    parseLiveCommentSettingsInput({
      nicolive: [
        { serviceId: 1, channelId: "ch1" },
        { serviceId: 2, channelId: "ch1" },
      ],
    }).ok,
    false,
  );
  // 片方が無効 → 許す
  assertEquals(
    parseLiveCommentSettingsInput({
      nicolive: [
        { serviceId: 1, channelId: "ch1" },
        { serviceId: 2, channelId: "ch1", enabled: false },
      ],
    }).ok,
    true,
  );
});

Deno.test("parseLiveCommentSettingsInput: 取得元をまたいだ重複は許す", () => {
  const parsed = parseLiveCommentSettingsInput({
    nicolive: [{ serviceId: 1, channelId: "ch1" }],
    "nx-jikkyo": [{ serviceId: 1, channelId: "jk1" }],
  });
  assertEquals(parsed.ok, true);
});

Deno.test("normalizeLiveCommentSettings: 正常値を通す", () => {
  assertEquals(
    normalizeLiveCommentSettings({
      nicolive: [{ serviceId: 1, channelId: "ch1", enabled: true }],
      "nx-jikkyo": [],
    }),
    {
      nicolive: [{ serviceId: 1, channelId: "ch1", enabled: true }],
      "nx-jikkyo": [],
    },
  );
});

Deno.test("normalizeLiveCommentSettings: 不正値は null (未保存扱い)", () => {
  assertEquals(normalizeLiveCommentSettings(null), null);
  assertEquals(normalizeLiveCommentSettings({ nicolive: "x" }), null);
  assertEquals(
    normalizeLiveCommentSettings({
      nicolive: [{ serviceId: 1, channelId: "bad", enabled: true }],
    }),
    null,
  );
});
