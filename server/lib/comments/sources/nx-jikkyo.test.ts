import { assertEquals } from "@std/assert";
import type { SourceComment } from "../types.ts";
import { type CommentSocket, createNxJikkyoSource } from "./nx-jikkyo.ts";

/** thread コマンドを受けると thread 応答 + 指定 chat を流すフェイク WebSocket。 */
class FakeSocket implements CommentSocket {
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  sent: string[] = [];
  closed = false;

  constructor(
    readonly url: string,
    readonly chats: Record<string, unknown>[],
  ) {
    queueMicrotask(() => this.onopen?.());
  }

  send(data: string): void {
    this.sent.push(data);
    const msg = JSON.parse(data);
    if (Array.isArray(msg) && msg.some((m) => m && m.thread)) {
      queueMicrotask(() => {
        this.onmessage?.({
          data: JSON.stringify({ thread: { thread: "23320", resultcode: 0 } }),
        });
        for (const chat of this.chats) {
          this.onmessage?.({ data: JSON.stringify({ chat }) });
        }
      });
    }
  }

  close(): void {
    this.closed = true;
  }
}

Deno.test("createNxJikkyoSource: resolveChannelId が null を返すと subscribe が null", async () => {
  // 設定に nx-jikkyo 割り当ての無いチャンネルを模す (実況非対応扱い)。
  const source = createNxJikkyoSource({ resolveChannelId: () => null });
  const sub = await source.subscribe(
    { id: 1, networkId: 7, serviceId: 354 },
    { signal: new AbortController().signal },
  );
  assertEquals(sub, null);
});

Deno.test("createNxJikkyoSource: resolveChannelId 注入で jk を差し替えられる", async () => {
  const source = createNxJikkyoSource({
    resolveChannelId: (target) => (target.id === 1 ? "jk1" : null),
    createWebSocket: (url) => new FakeSocket(url, []),
  });
  assertEquals(
    await source.subscribe(
      { id: 2, networkId: 0, serviceId: 0 },
      { signal: new AbortController().signal },
    ),
    null,
  );
  const sub = await source.subscribe(
    { id: 1, networkId: 0, serviceId: 0 },
    { signal: new AbortController().signal },
  );
  assertEquals(sub !== null, true);
});

Deno.test("createNxJikkyoSource: handshake を送り chat を SourceComment に正規化する", async () => {
  const sockets: FakeSocket[] = [];
  const chats: Record<string, unknown>[] = [
    {
      thread: "23320",
      no: 1,
      date: 1781401563,
      date_usec: 375541,
      content: "a",
      user_id: "nicolive:a:X",
      mail: "184",
    },
    // date_usec 省略 (0 のフィールドは本家仕様で省略される)
    { thread: "23320", no: 2, date: 1781401564, content: "b" },
    // 同一 id (thread:no) は重複排除される
    {
      thread: "23320",
      no: 1,
      date: 1781401563,
      date_usec: 375541,
      content: "a",
    },
    { thread: "23320", no: 3, date: 1781401565, content: "c" },
  ];
  const source = createNxJikkyoSource({
    resolveChannelId: () => "jk1",
    createWebSocket: (url) => {
      const socket = new FakeSocket(url, chats);
      sockets.push(socket);
      return socket;
    },
  });

  const abort = new AbortController();
  const sub = await source.subscribe(
    { id: 1, networkId: 0, serviceId: 0 },
    { signal: abort.signal },
  );

  const received: SourceComment[] = [];
  for await (const comment of sub!) {
    received.push(comment);
    if (received.length === 3) {
      abort.abort();
    }
  }

  assertEquals(received, [
    { id: "23320:1", source: "nx-jikkyo", at: 1781401563375, text: "a" },
    { id: "23320:2", source: "nx-jikkyo", at: 1781401564000, text: "b" },
    { id: "23320:3", source: "nx-jikkyo", at: 1781401565000, text: "c" },
  ]);

  assertEquals(sockets.length, 1);
  assertEquals(
    sockets[0].url,
    "wss://nx-jikkyo.tsukumijima.net/api/v1/channels/jk1/ws/comment",
  );
  const handshake = JSON.parse(sockets[0].sent[0]);
  const threadCmd = handshake.find((m: { thread?: unknown }) => m.thread);
  assertEquals(threadCmd.thread.version, "20061206");
  assertEquals(threadCmd.thread.thread, "");
  assertEquals(sockets[0].closed, true);
});
