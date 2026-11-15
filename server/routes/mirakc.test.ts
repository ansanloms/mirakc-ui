import assert from "node:assert/strict";
import { test } from "node:test";
import { createMirakcProxy } from "./mirakc.ts";

type Captured = { url: string; method: string };

function fakeUpstream(
  respond: (url: string, method: string) => Response = () => Response.json({ ok: true }),
) {
  const requests: Captured[] = [];
  const fetchFn = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    requests.push({ url, method });
    return Promise.resolve(respond(url, method));
  }) as typeof fetch;
  return { requests, fetchFn };
}

/** フックは await されない (floating promise) ため、マイクロタスクを流す。 */
function settle(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 10));
}

test("MIRAKC_URL 未設定なら 500", async () => {
  const app = createMirakcProxy({});
  const res = await app.request("/version");
  assert.deepStrictEqual(res.status, 500);
  await res.body?.cancel();
});

test("サブパス + クエリを ${MIRAKC_URL}/api 配下へ転送する", async () => {
  const { requests, fetchFn } = fakeUpstream(() => Response.json({ current: "x" }));
  const app = createMirakcProxy({
    mirakcUrl: "http://mirakc:40772",
    fetchFn,
  });

  const res = await app.request("/services/1/stream?decode=1");
  assert.deepStrictEqual(res.status, 200);
  await res.body?.cancel();
  assert.deepStrictEqual(requests, [
    {
      url: "http://mirakc:40772/api/services/1/stream?decode=1",
      method: "GET",
    },
  ]);
});

test("圧縮された応答の content-encoding / content-length は落とし、他のヘッダは残す", async () => {
  // Node の fetch は本文を展開して返すため、上流の値のままだと下流で食い違う。
  const { fetchFn } = fakeUpstream(
    () =>
      new Response("plain", {
        headers: {
          "content-type": "application/json",
          "content-encoding": "gzip",
          "content-length": "49",
          "x-test": "kept",
        },
      }),
  );
  const app = createMirakcProxy({
    mirakcUrl: "http://mirakc:40772",
    fetchFn,
  });

  const res = await app.request("/version");
  assert.deepStrictEqual(res.headers.get("content-encoding"), null);
  assert.deepStrictEqual(res.headers.get("content-length"), null);
  assert.deepStrictEqual(res.headers.get("content-type"), "application/json");
  assert.deepStrictEqual(res.headers.get("x-test"), "kept");
  assert.deepStrictEqual(await res.text(), "plain");
});

test("圧縮されていない応答は content-length を含むヘッダを保つ", async () => {
  const { fetchFn } = fakeUpstream(
    () =>
      new Response("plain", {
        headers: {
          "content-type": "application/json",
          "content-length": "5",
          "x-test": "kept",
        },
      }),
  );
  const app = createMirakcProxy({
    mirakcUrl: "http://mirakc:40772",
    fetchFn,
  });

  const res = await app.request("/version");
  assert.deepStrictEqual(res.headers.get("content-length"), "5");
  assert.deepStrictEqual(res.headers.get("content-type"), "application/json");
  assert.deepStrictEqual(res.headers.get("x-test"), "kept");
  assert.deepStrictEqual(await res.text(), "plain");
});

test("POST /recording/schedules 成功で onScheduleCreated が発火する", async () => {
  const schedule = {
    program: { id: 123, name: "ニュース", startAt: 0, duration: 1 },
    state: "scheduled",
    options: { contentPath: "x.m2ts" },
    tags: [],
  };
  const { fetchFn } = fakeUpstream(() => Response.json(schedule, { status: 201 }));
  const created: unknown[] = [];
  const app = createMirakcProxy({
    mirakcUrl: "http://mirakc:40772",
    hooks: { onScheduleCreated: (s) => void created.push(s) },
    fetchFn,
  });

  const res = await app.request("/recording/schedules", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ programId: 123 }),
  });
  assert.deepStrictEqual(res.status, 201);
  // クライアントへの応答 body も壊れていない。
  assert.deepStrictEqual((await res.json()).program.id, 123);

  await settle();
  assert.deepStrictEqual(created, [schedule]);
});

test("POST 失敗 (非 2xx) ではフックは発火しない", async () => {
  const { fetchFn } = fakeUpstream(() => new Response("conflict", { status: 409 }));
  const created: unknown[] = [];
  const app = createMirakcProxy({
    mirakcUrl: "http://mirakc:40772",
    hooks: { onScheduleCreated: (s) => void created.push(s) },
    fetchFn,
  });

  const res = await app.request("/recording/schedules", {
    method: "POST",
    body: "{}",
  });
  assert.deepStrictEqual(res.status, 409);
  await res.body?.cancel();
  await settle();
  assert.deepStrictEqual(created, []);
});

test("DELETE /recording/schedules/{id} 成功で onScheduleRemoved が発火する", async () => {
  const { fetchFn } = fakeUpstream(() => new Response(null, { status: 204 }));
  const removed: number[] = [];
  const app = createMirakcProxy({
    mirakcUrl: "http://mirakc:40772",
    hooks: { onScheduleRemoved: (id) => void removed.push(id) },
    fetchFn,
  });

  const res = await app.request("/recording/schedules/327360102706471", {
    method: "DELETE",
  });
  assert.deepStrictEqual(res.status, 204);
  await settle();
  assert.deepStrictEqual(removed, [327360102706471]);
});

test("予約以外の DELETE ではフックは発火しない", async () => {
  const { fetchFn } = fakeUpstream(() => new Response(null, { status: 204 }));
  const removed: number[] = [];
  const app = createMirakcProxy({
    mirakcUrl: "http://mirakc:40772",
    hooks: { onScheduleRemoved: (id) => void removed.push(id) },
    fetchFn,
  });

  await (await app.request("/timeshift/records/1", { method: "DELETE" })).body?.cancel();
  await settle();
  assert.deepStrictEqual(removed, []);
});
