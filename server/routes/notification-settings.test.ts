import { assertEquals } from "@std/assert";
import { createNotificationSettingsRoutes } from "./notification-settings.ts";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettings,
} from "../lib/notification-settings.ts";

function fakeStore(initial?: NotificationSettings) {
  let settings = initial ?? DEFAULT_NOTIFICATION_SETTINGS;
  return {
    get: () => Promise.resolve(settings),
    set: (next: NotificationSettings) => {
      settings = next;
      return Promise.resolve(settings);
    },
  };
}

function fakeSender(result: boolean) {
  const ntfy: { url: string; token: string }[] = [];
  const discord: { webhookUrl: string }[] = [];
  return {
    ntfy,
    discord,
    sendTestNtfy: (target: { url: string; token: string }) => {
      ntfy.push(target);
      return Promise.resolve(result);
    },
    sendTestDiscord: (target: { webhookUrl: string }) => {
      discord.push(target);
      return Promise.resolve(result);
    },
  };
}

Deno.test("GET /: 設定を返す (未保存なら既定値)", async () => {
  const app = createNotificationSettingsRoutes(fakeStore(), fakeSender(true));

  const res = await app.request("/");
  assertEquals(res.status, 200);
  assertEquals(await res.json(), DEFAULT_NOTIFICATION_SETTINGS);
});

Deno.test("PUT /: 設定を保存して返す", async () => {
  const store = fakeStore();
  const app = createNotificationSettingsRoutes(store, fakeSender(true));

  const res = await app.request("/", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      url: " https://ntfy.sh/mirakc-rec ",
      token: "tk",
      onStart: true,
      onEnd: false,
    }),
  });
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.url, "https://ntfy.sh/mirakc-rec");
  assertEquals(await store.get(), body);
});

Deno.test("PUT /: 不正な入力は 400", async () => {
  const app = createNotificationSettingsRoutes(fakeStore(), fakeSender(true));

  const bodies = [
    {},
    // イベント有効なのに url が空。
    { url: "", token: "", onStart: true, onEnd: false },
    { url: "not a url", token: "", onStart: false, onEnd: false },
  ];
  for (const body of bodies) {
    const res = await app.request("/", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    assertEquals(res.status, 400, JSON.stringify(body));
    await res.body?.cancel();
  }
});

Deno.test("POST /test/ntfy: draft の url/token で ntfy テスト送信する", async () => {
  const sender = fakeSender(true);
  const app = createNotificationSettingsRoutes(fakeStore(), sender);

  const res = await app.request("/test/ntfy", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url: "https://ntfy.sh/mirakc", token: "tk" }),
  });
  assertEquals(res.status, 200);
  assertEquals(await res.json(), { ok: true });
  assertEquals(sender.ntfy, [{ url: "https://ntfy.sh/mirakc", token: "tk" }]);
  assertEquals(sender.discord, []);
});

Deno.test("POST /test/discord: draft の webhookUrl で Discord テスト送信する", async () => {
  const sender = fakeSender(true);
  const app = createNotificationSettingsRoutes(fakeStore(), sender);

  const res = await app.request("/test/discord", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      webhookUrl: " https://discord.com/api/webhooks/123/abc ",
    }),
  });
  assertEquals(res.status, 200);
  assertEquals(await res.json(), { ok: true });
  assertEquals(sender.discord, [
    { webhookUrl: "https://discord.com/api/webhooks/123/abc" },
  ]);
  assertEquals(sender.ntfy, []);
});

Deno.test("POST /test/ntfy: 不正な URL は 400、送信失敗は 502", async () => {
  const invalid = await createNotificationSettingsRoutes(
    fakeStore(),
    fakeSender(true),
  ).request("/test/ntfy", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url: "https://ntfy.sh/", token: "" }),
  });
  assertEquals(invalid.status, 400);
  await invalid.body?.cancel();

  const failed = await createNotificationSettingsRoutes(
    fakeStore(),
    fakeSender(false),
  ).request("/test/ntfy", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url: "https://ntfy.sh/mirakc", token: "" }),
  });
  assertEquals(failed.status, 502);
  await failed.body?.cancel();
});

Deno.test("POST /test/discord: 不正な webhookUrl は 400、送信失敗は 502", async () => {
  const sender = fakeSender(true);
  const invalid = await createNotificationSettingsRoutes(fakeStore(), sender)
    .request("/test/discord", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ webhookUrl: "https://example.com/not-a-webhook" }),
    });
  assertEquals(invalid.status, 400);
  await invalid.body?.cancel();
  assertEquals(sender.discord, []);

  const failed = await createNotificationSettingsRoutes(
    fakeStore(),
    fakeSender(false),
  ).request("/test/discord", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      webhookUrl: "https://discord.com/api/webhooks/123/abc",
    }),
  });
  assertEquals(failed.status, 502);
  await failed.body?.cancel();
});
