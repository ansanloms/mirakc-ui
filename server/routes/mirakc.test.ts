import { assertEquals } from "@std/assert";
import { createMirakcProxy } from "./mirakc.ts";

type Captured = { url: string; method: string };

function fakeUpstream(
  respond: (url: string, method: string) => Response = () =>
    Response.json({ ok: true }),
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

Deno.test("MIRAKC_URL 未設定なら 500", async () => {
  const app = createMirakcProxy({});
  const res = await app.request("/version");
  assertEquals(res.status, 500);
  await res.body?.cancel();
});

Deno.test("サブパス + クエリを ${MIRAKC_URL}/api 配下へ転送する", async () => {
  const { requests, fetchFn } = fakeUpstream(() =>
    Response.json({ current: "x" })
  );
  const app = createMirakcProxy({
    mirakcUrl: "http://mirakc:40772",
    fetchFn,
  });

  const res = await app.request("/services/1/stream?decode=1");
  assertEquals(res.status, 200);
  await res.body?.cancel();
  assertEquals(requests, [{
    url: "http://mirakc:40772/api/services/1/stream?decode=1",
    method: "GET",
  }]);
});

Deno.test("POST /recording/schedules 成功で onScheduleCreated が発火する", async () => {
  const schedule = {
    program: { id: 123, name: "ニュース", startAt: 0, duration: 1 },
    state: "scheduled",
    options: { contentPath: "x.m2ts" },
    tags: [],
  };
  const { fetchFn } = fakeUpstream(() =>
    Response.json(schedule, { status: 201 })
  );
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
  assertEquals(res.status, 201);
  // クライアントへの応答 body も壊れていない。
  assertEquals((await res.json()).program.id, 123);

  await settle();
  assertEquals(created, [schedule]);
});

Deno.test("POST 失敗 (非 2xx) ではフックは発火しない", async () => {
  const { fetchFn } = fakeUpstream(() =>
    new Response("conflict", { status: 409 })
  );
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
  assertEquals(res.status, 409);
  await res.body?.cancel();
  await settle();
  assertEquals(created, []);
});

Deno.test("DELETE /recording/schedules/{id} 成功で onScheduleRemoved が発火する", async () => {
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
  assertEquals(res.status, 204);
  await settle();
  assertEquals(removed, [327360102706471]);
});

Deno.test("予約以外の DELETE ではフックは発火しない", async () => {
  const { fetchFn } = fakeUpstream(() => new Response(null, { status: 204 }));
  const removed: number[] = [];
  const app = createMirakcProxy({
    mirakcUrl: "http://mirakc:40772",
    hooks: { onScheduleRemoved: (id) => void removed.push(id) },
    fetchFn,
  });

  await (await app.request("/timeshift/records/1", { method: "DELETE" }))
    .body?.cancel();
  await settle();
  assertEquals(removed, []);
});
