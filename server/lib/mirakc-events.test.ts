import { assertEquals } from "@std/assert";
import {
  notifyProgramEvent,
  parseSseStream,
  recordingEventOf,
  subscribeMirakcEvents,
} from "./mirakc-events.ts";

function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

async function collect(stream: ReadableStream<Uint8Array>) {
  const events: { event: string; data: string }[] = [];
  for await (const event of parseSseStream(stream)) {
    events.push(event);
  }
  return events;
}

Deno.test("parseSseStream: event/data の組を空行区切りで取り出す", async () => {
  const events = await collect(streamOf([
    "event: recording.started\n",
    'data: {"programId":1}\n',
    "\n",
    ": keep-alive comment\n",
    "\n",
    "event: epg.programs-updated\n",
    'data: {"serviceId":2}\n\n',
  ]));

  assertEquals(events, [
    { event: "recording.started", data: '{"programId":1}' },
    { event: "epg.programs-updated", data: '{"serviceId":2}' },
  ]);
});

Deno.test("parseSseStream: チャンク境界が行の途中でも復元する", async () => {
  const events = await collect(streamOf([
    "event: recording.sta",
    'rted\ndata: {"programI',
    'd":42}\n\n',
  ]));

  assertEquals(events, [
    { event: "recording.started", data: '{"programId":42}' },
  ]);
});

Deno.test("recordingEventOf: 録画開始/終了/失敗イベントのみ kind 付きで返す", () => {
  assertEquals(
    recordingEventOf({
      event: "recording.started",
      data: '{"programId":123}',
    }),
    { kind: "started", programId: 123 },
  );
  assertEquals(
    recordingEventOf({
      event: "recording.stopped",
      data: '{"programId":123}',
    }),
    { kind: "stopped", programId: 123 },
  );
  assertEquals(
    recordingEventOf({
      event: "recording.failed",
      data: '{"programId":123,"reason":{"type":"io-error"}}',
    }),
    { kind: "failed", programId: 123 },
  );
  assertEquals(
    recordingEventOf({
      event: "recording.rescheduled",
      data: '{"programId":123}',
    }),
    null,
  );
  assertEquals(
    recordingEventOf({ event: "recording.started", data: "broken" }),
    null,
  );
});

Deno.test("subscribeMirakcEvents: イベントを購読し stop で再接続を止める", async () => {
  let connections = 0;
  const received: string[] = [];
  const fetchFn = ((input: RequestInfo | URL) => {
    assertEquals(String(input), "http://mirakc:40772/events");
    connections++;
    return Promise.resolve(
      new Response(
        streamOf(['event: recording.started\ndata: {"programId":1}\n\n']),
        { headers: { "content-type": "text/event-stream" } },
      ),
    );
  }) as typeof fetch;

  let resolveFirst: () => void;
  const firstEvent = new Promise<void>((resolve) => {
    resolveFirst = resolve;
  });

  const stop = subscribeMirakcEvents({
    eventsUrl: "http://mirakc:40772/events",
    onEvent: (event) => {
      received.push(event.event);
      resolveFirst();
    },
    fetchFn,
    retryDelayMs: 1,
  });

  await firstEvent;
  stop();
  // stop 後は再接続ループが止まる (多少の進行中接続は許容する)。
  const connectionsAtStop = connections;
  await new Promise((resolve) => setTimeout(resolve, 30));
  assertEquals(connections <= connectionsAtStop + 1, true);
  assertEquals(received.includes("recording.started"), true);
});

Deno.test("notifyProgramEvent: 番組名・チャンネル名・放送時間を入れて出し分ける", async () => {
  // 2026-01-02T03:04:00+09:00 から 30 分の番組。
  const startAt = Date.UTC(2026, 0, 1, 18, 4, 0);
  const fetchFn = ((input: RequestInfo | URL) => {
    const url = String(input);
    if (url === "http://mirakc:40772/api/programs/123") {
      return Promise.resolve(
        Response.json({
          id: 123,
          name: "ニュースウォッチ",
          startAt,
          duration: 30 * 60 * 1000,
          networkId: 32736,
          serviceId: 1024,
        }),
      );
    }
    if (url === "http://mirakc:40772/api/services") {
      return Promise.resolve(
        Response.json([
          { id: 1, networkId: 32736, serviceId: 1024, name: "NHK総合" },
          { id: 2, networkId: 32737, serviceId: 1032, name: "Eテレ" },
        ]),
      );
    }
    return Promise.resolve(new Response("not found", { status: 404 }));
  }) as typeof fetch;

  const notifications: { title: string; message: string }[] = [];
  const deps = {
    apiUrl: "http://mirakc:40772/api",
    notify: (n: { title: string; message: string }) => {
      notifications.push({ title: n.title, message: n.message });
      return Promise.resolve(true);
    },
    fetchFn,
    timeZone: "Asia/Tokyo",
  };

  await notifyProgramEvent(deps, { key: "started", programId: 123 });
  await notifyProgramEvent(deps, { key: "stopped", programId: 123 });

  assertEquals(notifications.length, 2);
  assertEquals(notifications[0].title, "録画開始: ニュースウォッチ");
  assertEquals(
    notifications[0].message,
    "録画を開始しました。\nNHK総合\n2026/01/02 03:04 〜 03:34",
  );
  assertEquals(notifications[1].title, "録画終了: ニュースウォッチ");
  assertEquals(
    notifications[1].message,
    "録画を終了しました。\nNHK総合\n2026/01/02 03:04 〜 03:34",
  );
});

Deno.test("notifyProgramEvent: サービス一覧が取れなくてもチャンネル名抜きで通知する", async () => {
  const startAt = Date.UTC(2026, 0, 1, 18, 4, 0);
  const fetchFn = ((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.endsWith("/programs/123")) {
      return Promise.resolve(
        Response.json({
          id: 123,
          name: "ニュースウォッチ",
          startAt,
          duration: 30 * 60 * 1000,
          networkId: 32736,
          serviceId: 1024,
        }),
      );
    }
    return Promise.resolve(new Response("ng", { status: 500 }));
  }) as typeof fetch;

  const notifications: { message: string }[] = [];
  await notifyProgramEvent({
    apiUrl: "http://mirakc:40772/api",
    notify: (n) => {
      notifications.push({ message: n.message });
      return Promise.resolve(true);
    },
    fetchFn,
    timeZone: "Asia/Tokyo",
  }, { key: "started", programId: 123 });

  assertEquals(
    notifications[0].message,
    "録画を開始しました。\n2026/01/02 03:04 〜 03:34",
  );
});

Deno.test("notifyProgramEvent: program 直渡しなら /programs を引かない", async () => {
  const startAt = Date.UTC(2026, 0, 1, 18, 4, 0);
  const requested: string[] = [];
  const fetchFn = ((input: RequestInfo | URL) => {
    const url = String(input);
    requested.push(url);
    if (url.endsWith("/services")) {
      return Promise.resolve(
        Response.json([
          { id: 1, networkId: 32736, serviceId: 1024, name: "NHK総合" },
        ]),
      );
    }
    return Promise.resolve(new Response("not found", { status: 404 }));
  }) as typeof fetch;

  const notifications: { title: string; message: string }[] = [];
  await notifyProgramEvent({
    apiUrl: "http://mirakc:40772/api",
    notify: (n) => {
      notifications.push({ title: n.title, message: n.message });
      return Promise.resolve(true);
    },
    fetchFn,
    timeZone: "Asia/Tokyo",
  }, {
    key: "scheduled",
    programId: 123,
    program: {
      name: "ニュースウォッチ",
      startAt,
      duration: 30 * 60 * 1000,
      networkId: 32736,
      serviceId: 1024,
    },
  });

  assertEquals(requested.some((url) => url.includes("/programs/")), false);
  assertEquals(notifications[0].title, "録画登録: ニュースウォッチ");
  assertEquals(
    notifications[0].message,
    "録画予約を登録しました。\nNHK総合\n2026/01/02 03:04 〜 03:34",
  );
});

Deno.test("notifyProgramEvent: failed / unscheduled の文言を出し分ける", async () => {
  const fetchFn =
    (() =>
      Promise.resolve(new Response("ng", { status: 404 }))) as typeof fetch;

  const notifications: { title: string; message: string }[] = [];
  const deps = {
    apiUrl: "http://mirakc:40772/api",
    notify: (n: { title: string; message: string }) => {
      notifications.push({ title: n.title, message: n.message });
      return Promise.resolve(true);
    },
    fetchFn,
  };

  await notifyProgramEvent(deps, { key: "failed", programId: 1 });
  await notifyProgramEvent(deps, { key: "unscheduled", programId: 1 });

  assertEquals(notifications[0].title, "録画失敗: 番組 ID: 1");
  assertEquals(notifications[0].message, "録画に失敗しました。");
  assertEquals(notifications[1].title, "録画削除: 番組 ID: 1");
  assertEquals(notifications[1].message, "録画予約を削除しました。");
});

Deno.test("notifyProgramEvent: 番組情報が取れなくても通知は出す", async () => {
  const fetchFn =
    (() =>
      Promise.resolve(new Response("ng", { status: 404 }))) as typeof fetch;

  const notifications: { title: string }[] = [];
  await notifyProgramEvent({
    apiUrl: "http://mirakc:40772/api",
    notify: (n) => {
      notifications.push({ title: n.title });
      return Promise.resolve(true);
    },
    fetchFn,
  }, { key: "started", programId: 456 });

  assertEquals(notifications.length, 1);
  assertEquals(notifications[0].title.includes("456"), true);
});
