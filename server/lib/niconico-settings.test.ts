import { assertEquals } from "@std/assert";
import {
  isValidNicoliveChannelId,
  normalizeNiconicoSettings,
  parseNiconicoSettingsInput,
} from "./niconico-settings.ts";

Deno.test("isValidNicoliveChannelId: ch + 数字のみ許可", () => {
  assertEquals(isValidNicoliveChannelId("ch2646436"), true);
  assertEquals(isValidNicoliveChannelId("ch1"), true);
  assertEquals(isValidNicoliveChannelId(""), false);
  assertEquals(isValidNicoliveChannelId("2646436"), false);
  assertEquals(isValidNicoliveChannelId("jk1"), false);
  assertEquals(isValidNicoliveChannelId("ch2646436x"), false);
  assertEquals(isValidNicoliveChannelId("lv12345"), false);
});

Deno.test("parseNiconicoSettingsInput: 正常入力を受理し trim する", () => {
  const parsed = parseNiconicoSettingsInput({
    channels: [
      { serviceId: 3273601024, nicoliveChannelId: " ch2646436 " },
      { serviceId: 400101, nicoliveChannelId: "ch2647992" },
    ],
  });
  assertEquals(parsed, {
    ok: true,
    input: {
      channels: [
        { serviceId: 3273601024, nicoliveChannelId: "ch2646436" },
        { serviceId: 400101, nicoliveChannelId: "ch2647992" },
      ],
    },
  });
});

Deno.test("parseNiconicoSettingsInput: 空の割り当ても受理する", () => {
  assertEquals(parseNiconicoSettingsInput({ channels: [] }), {
    ok: true,
    input: { channels: [] },
  });
});

Deno.test("parseNiconicoSettingsInput: channels が配列でなければエラー", () => {
  assertEquals(parseNiconicoSettingsInput({}).ok, false);
  assertEquals(parseNiconicoSettingsInput({ channels: "x" }).ok, false);
  assertEquals(parseNiconicoSettingsInput(null).ok, false);
});

Deno.test("parseNiconicoSettingsInput: 不正な ID 形式はエラー", () => {
  const parsed = parseNiconicoSettingsInput({
    channels: [{ serviceId: 1, nicoliveChannelId: "jk1" }],
  });
  assertEquals(parsed.ok, false);
});

Deno.test("parseNiconicoSettingsInput: serviceId が整数でなければエラー", () => {
  const parsed = parseNiconicoSettingsInput({
    channels: [{ serviceId: "1", nicoliveChannelId: "ch1" }],
  });
  assertEquals(parsed.ok, false);
});

Deno.test("parseNiconicoSettingsInput: serviceId の重複はエラー", () => {
  const parsed = parseNiconicoSettingsInput({
    channels: [
      { serviceId: 1, nicoliveChannelId: "ch1" },
      { serviceId: 1, nicoliveChannelId: "ch2" },
    ],
  });
  assertEquals(parsed.ok, false);
});

Deno.test("parseNiconicoSettingsInput: ニコニコチャンネル ID の重複はエラー", () => {
  const parsed = parseNiconicoSettingsInput({
    channels: [
      { serviceId: 1, nicoliveChannelId: "ch1" },
      { serviceId: 2, nicoliveChannelId: "ch1" },
    ],
  });
  assertEquals(parsed.ok, false);
});

Deno.test("normalizeNiconicoSettings: 保存済みの正常値を通す", () => {
  assertEquals(
    normalizeNiconicoSettings({
      channels: [{ serviceId: 1, nicoliveChannelId: "ch1" }],
    }),
    { channels: [{ serviceId: 1, nicoliveChannelId: "ch1" }] },
  );
});

Deno.test("normalizeNiconicoSettings: 不正値は null (未保存扱い)", () => {
  assertEquals(normalizeNiconicoSettings(null), null);
  assertEquals(normalizeNiconicoSettings({ channels: "x" }), null);
  assertEquals(
    normalizeNiconicoSettings({
      channels: [{ serviceId: 1, nicoliveChannelId: "bad" }],
    }),
    null,
  );
});
