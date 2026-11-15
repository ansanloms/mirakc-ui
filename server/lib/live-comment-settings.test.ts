import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isLiveCommentMapping,
  isValidChannelId,
  parseLiveCommentMappingInput,
} from "./live-comment-settings.ts";

test("isValidChannelId: 取得元ごとに ID 形式が違う", () => {
  assert.deepStrictEqual(isValidChannelId("nicolive", "ch2646436"), true);
  assert.deepStrictEqual(isValidChannelId("nicolive", "jk1"), false);
  assert.deepStrictEqual(isValidChannelId("nx-jikkyo", "jk1"), true);
  assert.deepStrictEqual(isValidChannelId("nx-jikkyo", "jk211"), true);
  assert.deepStrictEqual(isValidChannelId("nx-jikkyo", "ch2646436"), false);
  assert.deepStrictEqual(isValidChannelId("nicolive", ""), false);
  assert.deepStrictEqual(isValidChannelId("nx-jikkyo", "jk"), false);
});

test("parseLiveCommentMappingInput: channel と assignments を受理し trim する", () => {
  const parsed = parseLiveCommentMappingInput({
    channel: " 27 ",
    assignments: [
      { source: "nicolive", channelId: " ch2646436 " },
      { source: "nx-jikkyo", channelId: "jk1" },
    ],
  });
  assert.deepStrictEqual(parsed, {
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

test("parseLiveCommentMappingInput: assignments / enabled は省略可", () => {
  const parsed = parseLiveCommentMappingInput({ channel: "BS15_0" });
  assert.deepStrictEqual(parsed, {
    ok: true,
    input: { channel: "BS15_0", assignments: [], enabled: true },
  });
});

test("parseLiveCommentMappingInput: enabled を保持する", () => {
  const parsed = parseLiveCommentMappingInput({
    channel: "27",
    assignments: [{ source: "nx-jikkyo", channelId: "jk1" }],
    enabled: false,
  });
  assert.deepStrictEqual(parsed.ok, true);
  if (parsed.ok) {
    assert.deepStrictEqual(parsed.input.enabled, false);
  }
});

test("parseLiveCommentMappingInput: channel 必須・非空", () => {
  assert.deepStrictEqual(parseLiveCommentMappingInput({}).ok, false);
  assert.deepStrictEqual(parseLiveCommentMappingInput({ channel: "" }).ok, false);
  assert.deepStrictEqual(parseLiveCommentMappingInput({ channel: "   " }).ok, false);
});

test("parseLiveCommentMappingInput: 取得元ごとの ID 形式違反は不可", () => {
  // nicolive に jk 形式
  const a = parseLiveCommentMappingInput({
    channel: "27",
    assignments: [{ source: "nicolive", channelId: "jk1" }],
  });
  assert.deepStrictEqual(a.ok, false);
  // nx-jikkyo に ch 形式
  const b = parseLiveCommentMappingInput({
    channel: "27",
    assignments: [{ source: "nx-jikkyo", channelId: "ch2646436" }],
  });
  assert.deepStrictEqual(b.ok, false);
});

test("parseLiveCommentMappingInput: 未知の取得元は不可 (enum 検証)", () => {
  const parsed = parseLiveCommentMappingInput({
    channel: "27",
    assignments: [{ source: "unknown", channelId: "ch1" }],
  });
  assert.deepStrictEqual(parsed.ok, false);
});

test("parseLiveCommentMappingInput: エントリ内の (取得元, ID) 重複は不可", () => {
  const parsed = parseLiveCommentMappingInput({
    channel: "27",
    assignments: [
      { source: "nx-jikkyo", channelId: "jk1" },
      { source: "nx-jikkyo", channelId: "jk1" },
    ],
  });
  assert.deepStrictEqual(parsed.ok, false);
});

test("parseLiveCommentMappingInput: 取得元違いの同 ID は許す", () => {
  // 同一 ID 文字列でも取得元が違えば別物 (形式が違うので実際は衝突しないが念のため)。
  const parsed = parseLiveCommentMappingInput({
    channel: "27",
    assignments: [
      { source: "nicolive", channelId: "ch1" },
      { source: "nx-jikkyo", channelId: "jk1" },
    ],
  });
  assert.deepStrictEqual(parsed.ok, true);
});

test("isLiveCommentMapping: 構造が合えば true、欠ければ false", () => {
  const valid = {
    id: "0f9a1b2c-3d4e-5f60-7182-93a4b5c6d7e8",
    channel: "27",
    assignments: [{ source: "nx-jikkyo", channelId: "jk1" }],
    enabled: true,
    createdAt: 1767225600000,
  };
  assert.deepStrictEqual(isLiveCommentMapping(valid), true);
  // id 欠落
  assert.deepStrictEqual(isLiveCommentMapping({ ...valid, id: undefined }), false);
  // 旧シングルトン形状 (取得元キーの配列)
  assert.deepStrictEqual(isLiveCommentMapping({ nicolive: [], "nx-jikkyo": [] }), false);
  // id が uuid でない
  assert.deepStrictEqual(isLiveCommentMapping({ ...valid, id: "not-a-uuid" }), false);
});
