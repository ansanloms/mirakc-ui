import { assertEquals } from "@std/assert";
import { createLiveCommentSettingsRoutes } from "./live-comment-settings.ts";
import type { LiveCommentSettings } from "../lib/live-comment-settings.ts";

/** NHK総合 (jk1/ch2646436) / NHKEテレ (jk2/ch2646437) / サブch / 実況なし。 */
const SERVICES = [
  { id: 3273601024, networkId: 0x7fe0, serviceId: 0x0400, name: "NHK総合" },
  { id: 3273601032, networkId: 0x7fe0, serviceId: 0x0408, name: "NHKEテレ" },
  { id: 3273601025, networkId: 0x7fe0, serviceId: 0x0401, name: "NHK総合2" },
  { id: 99999, networkId: 0xfff, serviceId: 1, name: "実況なし" },
];

function fakeStoreOf(initial: LiveCommentSettings | null) {
  let value = initial;
  return {
    saved: () => value,
    get: () => Promise.resolve(value),
    set: (settings: LiveCommentSettings) => {
      value = settings;
      return Promise.resolve(settings);
    },
  };
}

const fetchFn = ((input: RequestInfo | URL) => {
  if (String(input) === "http://mirakc/api/services") {
    return Promise.resolve(Response.json(SERVICES));
  }
  return Promise.resolve(new Response("not found", { status: 404 }));
}) as typeof fetch;

Deno.test("GET: 未保存なら取得元ごとに既定値と候補を返す", async () => {
  const app = createLiveCommentSettingsRoutes(fakeStoreOf(null), {
    mirakcApiUrl: "http://mirakc/api",
    fetchFn,
  });
  const body = await (await app.request("/")).json();
  assertEquals(body.saved, false);
  // nicolive: ch ID。サブチャンネルは同一 ch に畳まれる。既定は有効
  assertEquals(body.channels.nicolive, [
    { serviceId: 3273601024, channelId: "ch2646436", enabled: true },
    { serviceId: 3273601032, channelId: "ch2646437", enabled: true },
  ]);
  // nx-jikkyo: jk ID
  assertEquals(body.channels["nx-jikkyo"], [
    { serviceId: 3273601024, channelId: "jk1", enabled: true },
    { serviceId: 3273601032, channelId: "jk2", enabled: true },
  ]);
  // 候補は両取得元 (実況なしを除く全サービス)
  assertEquals(body.suggestions.nicolive, {
    "3273601024": "ch2646436",
    "3273601032": "ch2646437",
    "3273601025": "ch2646436",
  });
  assertEquals(body.suggestions["nx-jikkyo"], {
    "3273601024": "jk1",
    "3273601032": "jk2",
    "3273601025": "jk1",
  });
});

Deno.test("GET: 保存済みなら保存値を返す", async () => {
  const saved = {
    nicolive: [{ serviceId: 3273601024, channelId: "ch999", enabled: true }],
    "nx-jikkyo": [],
  };
  const app = createLiveCommentSettingsRoutes(fakeStoreOf(saved), {
    mirakcApiUrl: "http://mirakc/api",
    fetchFn,
  });
  const body = await (await app.request("/")).json();
  assertEquals(body.saved, true);
  assertEquals(body.channels.nicolive, saved.nicolive);
  assertEquals(body.channels["nx-jikkyo"], []);
});

Deno.test("GET: MIRAKC_URL 未設定でも空の既定値で応答する", async () => {
  const app = createLiveCommentSettingsRoutes(fakeStoreOf(null), {
    mirakcApiUrl: undefined,
  });
  const body = await (await app.request("/")).json();
  assertEquals(body, {
    saved: false,
    channels: { "nicolive": [], "nx-jikkyo": [] },
    suggestions: { "nicolive": {}, "nx-jikkyo": {} },
  });
});

Deno.test("PUT: 取得元ごとの割り当てを保存して返す", async () => {
  const store = fakeStoreOf(null);
  const app = createLiveCommentSettingsRoutes(store, {
    mirakcApiUrl: "http://mirakc/api",
    fetchFn,
  });
  const settings = {
    nicolive: [{
      serviceId: 3273601024,
      channelId: "ch2646436",
      enabled: true,
    }],
    "nx-jikkyo": [{ serviceId: 3273601024, channelId: "jk1", enabled: true }],
  };
  const res = await app.request("/", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(settings),
  });
  assertEquals(res.status, 200);
  assertEquals(await res.json(), settings);
  assertEquals(store.saved(), settings);
});

Deno.test("PUT: 取得元の ID 形式違反は 400", async () => {
  const app = createLiveCommentSettingsRoutes(fakeStoreOf(null), {
    mirakcApiUrl: "http://mirakc/api",
    fetchFn,
  });
  const res = await app.request("/", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    // nicolive に jk 形式
    body: JSON.stringify({
      nicolive: [{ serviceId: 1, channelId: "jk1" }],
    }),
  });
  assertEquals(res.status, 400);
  await res.body?.cancel();
});
