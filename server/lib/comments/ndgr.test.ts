import { assertEquals } from "@std/assert";
import { decodeChunkedEntry, decodeChunkedMessage } from "./ndgr.ts";
import {
  chatMessageOf,
  lenField,
  nextEntryOf,
  segmentEntryOf,
  stringField,
  varintField,
} from "./ndgr-fixtures.ts";

Deno.test("decodeChunkedEntry: segment エントリから URI を取り出す", () => {
  const bytes = new Uint8Array(segmentEntryOf("https://example.com/segment/1"));
  assertEquals(decodeChunkedEntry(bytes), {
    segmentUri: "https://example.com/segment/1",
  });
});

Deno.test("decodeChunkedEntry: next エントリから at (epoch 秒) を取り出す", () => {
  const bytes = new Uint8Array(nextEntryOf(1718240400));
  assertEquals(decodeChunkedEntry(bytes), { nextAt: 1718240400 });
});

Deno.test("decodeChunkedEntry: backward / previous は無視する", () => {
  // ChunkedEntry { backward(2): ... } — 過去ログ遡行はライブ視聴では使わない
  const bytes = new Uint8Array(lenField(2, stringField(1, "ignored")));
  assertEquals(decodeChunkedEntry(bytes), {});
});

Deno.test("decodeChunkedMessage: chat メッセージを取り出す", () => {
  const bytes = new Uint8Array(chatMessageOf({
    id: "msg-1",
    atSeconds: 1718240400,
    atNanos: 500_000_000,
    content: "こんにちは",
  }));
  assertEquals(decodeChunkedMessage(bytes), {
    id: "msg-1",
    atMs: 1718240400_500,
    chat: { content: "こんにちは", name: undefined },
  });
});

Deno.test("decodeChunkedMessage: 投稿者名付き chat", () => {
  const bytes = new Uint8Array(chatMessageOf({
    id: "msg-2",
    atSeconds: 1718240401,
    content: "named",
    name: "テスト太郎",
  }));
  assertEquals(decodeChunkedMessage(bytes), {
    id: "msg-2",
    atMs: 1718240401_000,
    chat: { content: "named", name: "テスト太郎" },
  });
});

Deno.test("decodeChunkedMessage: overflowed_chat (field 20) も chat として扱う", () => {
  const bytes = new Uint8Array(chatMessageOf({
    id: "msg-3",
    atSeconds: 1718240402,
    content: "overflowed",
    chatFieldNo: 20,
  }));
  assertEquals(decodeChunkedMessage(bytes), {
    id: "msg-3",
    atMs: 1718240402_000,
    chat: { content: "overflowed", name: undefined },
  });
});

Deno.test("decodeChunkedMessage: chat 以外 (state 等) は chat 無しで返す", () => {
  // ChunkedMessage { meta(1), state(4): ... }
  const bytes = new Uint8Array([
    ...chatMessageOf({ id: "msg-4", atSeconds: 1718240403 }),
    ...lenField(4, varintField(1, 1)),
  ]);
  assertEquals(decodeChunkedMessage(bytes), {
    id: "msg-4",
    atMs: 1718240403_000,
    chat: undefined,
  });
});

Deno.test("decodeChunkedMessage: meta が無ければ null", () => {
  const bytes = new Uint8Array(lenField(4, varintField(1, 1)));
  assertEquals(decodeChunkedMessage(bytes), null);
});
