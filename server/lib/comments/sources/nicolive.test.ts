import { assertEquals, assertThrows } from "@std/assert";
import type { SourceComment } from "../types.ts";
import {
  createNicoliveSource,
  parseEmbeddedData,
  type WatchSessionSocket,
} from "./nicolive.ts";
import {
  chatMessageOf,
  lengthDelimitedOf,
  nextEntryOf,
  segmentEntryOf,
} from "../ndgr-fixtures.ts";

function escapeHtmlAttr(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function watchPageOf(props: unknown): string {
  // 実ページは <script id="embedded-data" data-props="..."> 形式
  return [
    "<!DOCTYPE html><html><body>",
    `<script id="embedded-data" data-props="${
      escapeHtmlAttr(JSON.stringify(props))
    }"></script>`,
    "</body></html>",
  ].join("");
}

Deno.test("parseEmbeddedData: webSocketUrl と status を取り出す (実体参照を復元)", () => {
  const html = watchPageOf({
    site: {
      relive: { webSocketUrl: "wss://a.live2.nicovideo.jp/wsapi?x=1&y=2" },
    },
    program: { status: "ON_AIR" },
  });
  assertEquals(parseEmbeddedData(html), {
    webSocketUrl: "wss://a.live2.nicovideo.jp/wsapi?x=1&y=2",
    status: "ON_AIR",
  });
});

Deno.test("parseEmbeddedData: タグ名や属性順に依存しない", () => {
  const html = `<div class="x" data-props="${
    escapeHtmlAttr(JSON.stringify({ program: { status: "ON_AIR" } }))
  }" id="embedded-data"></div>`;
  assertEquals(parseEmbeddedData(html).status, "ON_AIR");
});

Deno.test("parseEmbeddedData: embedded-data が無ければ例外", () => {
  assertThrows(() => parseEmbeddedData("<html></html>"));
});

Deno.test("parseEmbeddedData: 欠けたフィールドは null", () => {
  assertEquals(parseEmbeddedData(watchPageOf({})), {
    webSocketUrl: null,
    status: null,
  });
});

Deno.test("createNicoliveSource: 本家実況の無いチャンネルは subscribe が null", async () => {
  const source = createNicoliveSource();
  // BS日テレ (jk141) は NX-Jikkyo 専用
  const subscription = await source.subscribe(
    { id: 400141, networkId: 4, serviceId: 141 },
    { signal: new AbortController().signal },
  );
  assertEquals(subscription, null);
});

/** abort されたら reject する pending Promise (ハング防止のため必須)。 */
function abortedRejection(signal: AbortSignal | undefined): Promise<never> {
  return new Promise((_, reject) => {
    if (signal === undefined) {
      return;
    }
    const onAbort = () =>
      reject(signal.reason ?? new DOMException("aborted", "AbortError"));
    if (signal.aborted) {
      onAbort();
      return;
    }
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

class FakeWatchSocket implements WatchSessionSocket {
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  sent: string[] = [];
  closed = false;

  constructor(readonly url: string, readonly viewUri: string) {
    queueMicrotask(() => this.onopen?.());
  }

  send(data: string): void {
    this.sent.push(data);
    const message = JSON.parse(data);
    if (message.type === "startWatching") {
      queueMicrotask(() =>
        this.onmessage?.({
          data: JSON.stringify({
            type: "messageServer",
            data: { viewUri: this.viewUri },
          }),
        })
      );
    }
  }

  close(): void {
    this.closed = true;
  }
}

Deno.test("createNicoliveSource: watch ページ → 視聴セッション → NDGR の流れでコメントを受信する", async () => {
  const viewUri = "https://mpn.example/api/view/v4/abc";
  const watchHtml = watchPageOf({
    site: { relive: { webSocketUrl: "wss://watch.example/session" } },
    program: { status: "ON_AIR" },
  });

  const sockets: FakeWatchSocket[] = [];
  const requested: string[] = [];

  const fetchFn = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    requested.push(url);
    if (url === "https://live.nicovideo.jp/watch/ch2646436") {
      return Promise.resolve(new Response(watchHtml, { status: 200 }));
    }
    if (url === `${viewUri}?at=now`) {
      // segment 1 件 + next カーソルを流して閉じる
      return Promise.resolve(
        new Response(
          lengthDelimitedOf([
            segmentEntryOf("https://mpn.example/segment/1"),
            nextEntryOf(1718240416),
          ]),
          { status: 200 },
        ),
      );
    }
    if (url === `${viewUri}?at=1718240416`) {
      // 2 巡目の View は応答せず保留 (abort で打ち切られる)
      return abortedRejection(init?.signal ?? undefined);
    }
    if (url === "https://mpn.example/segment/1") {
      return Promise.resolve(
        new Response(
          lengthDelimitedOf([
            chatMessageOf({
              id: "m1",
              atSeconds: 1718240401,
              content: "こんにちは",
            }),
            // 重複 (同一 id) は排除される
            chatMessageOf({
              id: "m1",
              atSeconds: 1718240401,
              content: "こんにちは",
            }),
            chatMessageOf({
              id: "m2",
              atSeconds: 1718240402,
              atNanos: 250_000_000,
              content: "named",
              name: "テスト太郎",
            }),
          ]),
          { status: 200 },
        ),
      );
    }
    return Promise.resolve(new Response("not found", { status: 404 }));
  }) as typeof fetch;

  const source = createNicoliveSource({
    fetchFn,
    createWebSocket: (url) => {
      const socket = new FakeWatchSocket(url, viewUri);
      sockets.push(socket);
      return socket;
    },
  });

  const abort = new AbortController();
  const subscription = await source.subscribe(
    // NHK総合・東京 → jk1 → ch2646436
    { id: 3273601024, networkId: 0x7fe0, serviceId: 0x0400 },
    { signal: abort.signal },
  );
  assertEquals(subscription !== null, true);

  const received: SourceComment[] = [];
  for await (const comment of subscription!) {
    received.push(comment);
    if (received.length === 2) {
      abort.abort();
    }
  }

  assertEquals(received, [
    {
      id: "m1",
      source: "nicolive",
      at: 1718240401_000,
      text: "こんにちは",
      author: undefined,
    },
    {
      id: "m2",
      source: "nicolive",
      at: 1718240402_250,
      text: "named",
      author: "テスト太郎",
    },
  ]);

  // 視聴セッションは startWatching を送って閉じられている
  assertEquals(sockets.length, 1);
  assertEquals(JSON.parse(sockets[0].sent[0]).type, "startWatching");
  assertEquals(sockets[0].closed, true);
  // View へ at=now → at=<next> の順でアクセスしている
  assertEquals(requested.includes(`${viewUri}?at=now`), true);
  assertEquals(requested.includes(`${viewUri}?at=1718240416`), true);
});

Deno.test("createNicoliveSource: 放送休止中 (ON_AIR 以外) はコメントを流さず待機する", async () => {
  const watchHtml = watchPageOf({
    site: { relive: { webSocketUrl: "" } },
    program: { status: "ENDED" },
  });
  const fetchFn = (() =>
    Promise.resolve(
      new Response(watchHtml, { status: 200 }),
    )) as typeof fetch;

  const source = createNicoliveSource({
    fetchFn,
    createWebSocket: () => {
      throw new Error("must not connect watch session");
    },
    offAirDelayMs: 10,
  });

  const abort = new AbortController();
  const subscription = (await source.subscribe(
    { id: 3273601024, networkId: 0x7fe0, serviceId: 0x0400 },
    { signal: abort.signal },
  ))!;

  // 少し回してから打ち切る。コメントは 1 件も流れない。
  setTimeout(() => abort.abort(), 50);
  const received: SourceComment[] = [];
  for await (const comment of subscription) {
    received.push(comment);
  }
  assertEquals(received, []);
});

Deno.test("createNicoliveSource: resolveChannelId の注入で対照表を差し替えられる", async () => {
  const resolved: number[] = [];
  const source = createNicoliveSource({
    resolveChannelId: (target) => {
      resolved.push(target.id);
      // 設定ストア参照を模した非同期解決。null = 実況非対応
      return Promise.resolve(target.id === 1 ? "ch999" : null);
    },
    fetchFn: (() =>
      Promise.resolve(new Response("x", { status: 404 }))) as typeof fetch,
    createWebSocket: () => {
      throw new Error("not reached");
    },
  });

  const none = await source.subscribe(
    { id: 2, networkId: 0, serviceId: 0 },
    { signal: new AbortController().signal },
  );
  assertEquals(none, null);

  const abort = new AbortController();
  const subscription = await source.subscribe(
    { id: 1, networkId: 0, serviceId: 0 },
    { signal: abort.signal },
  );
  assertEquals(subscription !== null, true);
  // 後始末 (接続自体は 404 で失敗し続けるため即 abort)
  abort.abort();
  for await (const _ of subscription!) {
    // abort 済みのため何も流れない
  }
  assertEquals(resolved, [2, 1]);
});
