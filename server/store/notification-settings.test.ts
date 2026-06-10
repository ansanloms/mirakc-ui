import { assertEquals } from "@std/assert";
import { NotificationSettingsStore } from "./notification-settings.ts";
import { Kv } from "./kv.ts";
import { DEFAULT_NOTIFICATION_SETTINGS } from "../lib/notification-settings.ts";

async function withStore(
  fn: (store: NotificationSettingsStore) => Promise<void>,
) {
  const kv = new Kv(":memory:");
  try {
    await fn(new NotificationSettingsStore(kv));
  } finally {
    await kv.close();
  }
}

Deno.test("get: 未保存なら既定値を返す", async () => {
  await withStore(async (store) => {
    assertEquals(await store.get(), DEFAULT_NOTIFICATION_SETTINGS);
  });
});

Deno.test("set: 保存した値を get で読める", async () => {
  await withStore(async (store) => {
    const settings = {
      url: "https://ntfy.sh/mirakc-rec",
      token: "tk_abc",
      onStart: true,
      onEnd: false,
    };
    const saved = await store.set(settings);
    assertEquals(saved, settings);
    assertEquals(await store.get(), settings);
  });
});

Deno.test("set: 全上書きする (前回値とのマージはしない)", async () => {
  await withStore(async (store) => {
    await store.set({
      url: "https://ntfy.sh/a",
      token: "tk",
      onStart: true,
      onEnd: true,
    });
    const next = { url: "", token: "", onStart: false, onEnd: false };
    await store.set(next);
    assertEquals(await store.get(), next);
  });
});

Deno.test("複数 store が同じ Kv を共有できる", async () => {
  const kv = new Kv(":memory:");
  try {
    const a = new NotificationSettingsStore(kv);
    const b = new NotificationSettingsStore(kv);
    await a.set({ url: "https://ntfy.sh/x", token: "", onStart: true, onEnd: false });
    assertEquals((await b.get()).url, "https://ntfy.sh/x");
  } finally {
    await kv.close();
  }
});
