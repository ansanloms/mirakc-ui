import { assertEquals } from "@std/assert";
import {
  isLiveCommentMapping,
  isValidChannelId,
  parseLiveCommentMappingInput,
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

Deno.test("parseLiveCommentMappingInput: channel と assignments を受理し trim する", () => {
  const parsed = parseLiveCommentMappingInput({
    channel: " 27 ",
    assignments: [
      { source: "nicolive", channelId: " ch2646436 " },
      { source: "nx-jikkyo", channelId: "jk1" },
    ],
  });
  assertEquals(parsed, {
    ok: true,
    input: {
      channel: "27",
      assignments: [
        { source: "nicolive", channelId: "ch2646436" },
        { source: "nx-jikkyo", channelId: "jk1" },
      ],
      enabled: true,
    },
  });
});

Deno.test("parseLiveCommentMappingInput: assignments / enabled は省略可", () => {
  const parsed = parseLiveCommentMappingInput({ channel: "BS15_0" });
  assertEquals(parsed, {
    ok: true,
    input: { channel: "BS15_0", assignments: [], enabled: true },
  });
});

Deno.test("parseLiveCommentMappingInput: enabled を保持する", () => {
  const parsed = parseLiveCommentMappingInput({
    channel: "27",
    assignments: [{ source: "nx-jikkyo", channelId: "jk1" }],
    enabled: false,
  });
  assertEquals(parsed.ok, true);
  if (parsed.ok) {
    assertEquals(parsed.input.enabled, false);
  }
});

Deno.test("parseLiveCommentMappingInput: channel 必須・非空", () => {
  assertEquals(parseLiveCommentMappingInput({}).ok, false);
  assertEquals(parseLiveCommentMappingInput({ channel: "" }).ok, false);
  assertEquals(parseLiveCommentMappingInput({ channel: "   " }).ok, false);
});

Deno.test("parseLiveCommentMappingInput: 取得元ごとの ID 形式違反は不可", () => {
  // nicolive に jk 形式
  const a = parseLiveCommentMappingInput({
    channel: "27",
    assignments: [{ source: "nicolive", channelId: "jk1" }],
  });
  assertEquals(a.ok, false);
  // nx-jikkyo に ch 形式
  const b = parseLiveCommentMappingInput({
    channel: "27",
    assignments: [{ source: "nx-jikkyo", channelId: "ch2646436" }],
  });
  assertEquals(b.ok, false);
});

Deno.test("parseLiveCommentMappingInput: 未知の取得元は不可 (enum 検証)", () => {
  const parsed = parseLiveCommentMappingInput({
    channel: "27",
    assignments: [{ source: "unknown", channelId: "ch1" }],
  });
  assertEquals(parsed.ok, false);
});

Deno.test("parseLiveCommentMappingInput: エントリ内の (取得元, ID) 重複は不可", () => {
  const parsed = parseLiveCommentMappingInput({
    channel: "27",
    assignments: [
      { source: "nx-jikkyo", channelId: "jk1" },
      { source: "nx-jikkyo", channelId: "jk1" },
    ],
  });
  assertEquals(parsed.ok, false);
});

Deno.test("parseLiveCommentMappingInput: 取得元違いの同 ID は許す", () => {
  // 同一 ID 文字列でも取得元が違えば別物 (形式が違うので実際は衝突しないが念のため)。
  const parsed = parseLiveCommentMappingInput({
    channel: "27",
    assignments: [
      { source: "nicolive", channelId: "ch1" },
      { source: "nx-jikkyo", channelId: "jk1" },
    ],
  });
  assertEquals(parsed.ok, true);
});

Deno.test("isLiveCommentMapping: 構造が合えば true、欠ければ false", () => {
  const valid = {
    id: "0f9a1b2c-3d4e-5f60-7182-93a4b5c6d7e8",
    channel: "27",
    assignments: [{ source: "nx-jikkyo", channelId: "jk1" }],
    enabled: true,
    createdAt: 1767225600000,
  };
  assertEquals(isLiveCommentMapping(valid), true);
  // id 欠落
  assertEquals(isLiveCommentMapping({ ...valid, id: undefined }), false);
  // 旧シングルトン形状 (取得元キーの配列)
  assertEquals(
    isLiveCommentMapping({ nicolive: [], "nx-jikkyo": [] }),
    false,
  );
  // id が uuid でない
  assertEquals(isLiveCommentMapping({ ...valid, id: "not-a-uuid" }), false);
});
