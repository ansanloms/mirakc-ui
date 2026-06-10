import { assertEquals } from "@std/assert";
import {
  mirakcEventsUrl,
  notifyRecordingEvent,
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

Deno.test("mirakcEventsUrl: /api を剥がして /events を組み立てる", () => {
  assertEquals(
    mirakcEventsUrl("http://mirakc:40772/api"),
    "http://mirakc:40772/events",
  );
  assertEquals(
    mirakcEventsUrl("http://mirakc:40772/api/"),
    "http://mirakc:40772/events",
  );
  assertEquals(
    mirakcEventsUrl("http://mirakc:40772"),
    "http://mirakc:40772/events",
  );
});

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

Deno.test("recordingEventOf: 録画開始/終了イベントのみ kind 付きで返す", () => {
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
    mirakcApiUrl: "http://mirakc:40772/api",
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

Deno.test("notifyRecordingEvent: 番組名を引いて開始/終了を出し分ける", async () => {
  const fetchFn = ((input: RequestInfo | URL) => {
    assertEquals(String(input), "http://mirakc:40772/api/programs/123");
    return Promise.resolve(
      Response.json({ id: 123, name: "ニュースウォッチ", startAt: 0 }),
    );
  }) as typeof fetch;

  const notifications: { title: string; message: string }[] = [];
  const deps = {
    mirakcApiUrl: "http://mirakc:40772/api",
    notify: (n: { title: string; message: string }) => {
      notifications.push({ title: n.title, message: n.message });
      return Promise.resolve(true);
    },
    fetchFn,
  };

  await notifyRecordingEvent(deps, { kind: "started", programId: 123 });
  await notifyRecordingEvent(deps, { kind: "stopped", programId: 123 });

  assertEquals(notifications.length, 2);
  assertEquals(notifications[0].title, "録画開始: ニュースウォッチ");
  assertEquals(notifications[0].message.includes("開始しました"), true);
  assertEquals(notifications[1].title, "録画終了: ニュースウォッチ");
  assertEquals(notifications[1].message.includes("終了しました"), true);
});

Deno.test("notifyRecordingEvent: 番組情報が取れなくても通知は出す", async () => {
  const fetchFn =
    (() =>
      Promise.resolve(new Response("ng", { status: 404 }))) as typeof fetch;

  const notifications: { title: string }[] = [];
  await notifyRecordingEvent({
    mirakcApiUrl: "http://mirakc:40772/api",
    notify: (n) => {
      notifications.push({ title: n.title });
      return Promise.resolve(true);
    },
    fetchFn,
  }, { kind: "started", programId: 456 });

  assertEquals(notifications.length, 1);
  assertEquals(notifications[0].title.includes("456"), true);
});
