import { assertEquals } from "@std/assert";
import { createNiconicoSettingsRoutes } from "./niconico-settings.ts";
import type { NiconicoSettings } from "../lib/niconico-settings.ts";

/** NHK総合・東京 (jk1 = ch2646436) / NHKEテレ (jk2) / 実況なしの 3 サービス。 */
const SERVICES = [
  { id: 3273601024, networkId: 0x7fe0, serviceId: 0x0400, name: "NHK総合" },
  { id: 3273601032, networkId: 0x7fe0, serviceId: 0x0408, name: "NHKEテレ" },
  // NHK総合2 (サブチャンネル) — jk1 に解決され、既定値では畳まれる
  { id: 3273601025, networkId: 0x7fe0, serviceId: 0x0401, name: "NHK総合2" },
  { id: 99999, networkId: 0xfff, serviceId: 1, name: "実況なし" },
];

function fakeStoreOf(initial: NiconicoSettings | null) {
  let value = initial;
  return {
    saved: () => value,
    get: () => Promise.resolve(value),
    set: (settings: NiconicoSettings) => {
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

Deno.test("GET: 未保存なら組み込み対照表から既定値と候補を返す", async () => {
  const app = createNiconicoSettingsRoutes(fakeStoreOf(null), {
    mirakcApiUrl: "http://mirakc/api",
    fetchFn,
  });
  const res = await app.request("/");
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.saved, false);
  // サブチャンネル (NHK総合2 → 同じ ch2646436) は先勝ちで畳まれる
  assertEquals(body.channels, [
    { serviceId: 3273601024, nicoliveChannelId: "ch2646436" },
    { serviceId: 3273601032, nicoliveChannelId: "ch2646437" },
  ]);
  // 候補には全サービス分 (実況なしを除く) が載る
  assertEquals(body.suggestions, {
    "3273601024": "ch2646436",
    "3273601032": "ch2646437",
    "3273601025": "ch2646436",
  });
});

Deno.test("GET: 保存済みなら保存値を返す", async () => {
  const saved = {
    channels: [{ serviceId: 3273601024, nicoliveChannelId: "ch999" }],
  };
  const app = createNiconicoSettingsRoutes(fakeStoreOf(saved), {
    mirakcApiUrl: "http://mirakc/api",
    fetchFn,
  });
  const body = await (await app.request("/")).json();
  assertEquals(body.saved, true);
  assertEquals(body.channels, saved.channels);
});

Deno.test("GET: MIRAKC_URL 未設定でも空の既定値で応答する", async () => {
  const app = createNiconicoSettingsRoutes(fakeStoreOf(null), {
    mirakcApiUrl: undefined,
  });
  const body = await (await app.request("/")).json();
  assertEquals(body, { saved: false, channels: [], suggestions: {} });
});

Deno.test("PUT: 正常入力を保存して返す", async () => {
  const store = fakeStoreOf(null);
  const app = createNiconicoSettingsRoutes(store, {
    mirakcApiUrl: "http://mirakc/api",
    fetchFn,
  });
  const settings = {
    channels: [{ serviceId: 3273601024, nicoliveChannelId: "ch2646436" }],
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

Deno.test("PUT: 重複・不正形式は 400", async () => {
  const app = createNiconicoSettingsRoutes(fakeStoreOf(null), {
    mirakcApiUrl: "http://mirakc/api",
    fetchFn,
  });
  const dup = await app.request("/", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      channels: [
        { serviceId: 1, nicoliveChannelId: "ch1" },
        { serviceId: 2, nicoliveChannelId: "ch1" },
      ],
    }),
  });
  assertEquals(dup.status, 400);
  await dup.body?.cancel();

  const invalid = await app.request("/", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: "broken",
  });
  assertEquals(invalid.status, 400);
  await invalid.body?.cancel();
});
