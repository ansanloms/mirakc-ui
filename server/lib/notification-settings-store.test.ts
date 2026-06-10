import { assertEquals } from "@std/assert";
import { NotificationSettingsStore } from "./notification-settings-store.ts";
import { DEFAULT_NOTIFICATION_SETTINGS } from "./notification-settings.ts";

async function withStore(
  fn: (store: NotificationSettingsStore) => Promise<void>,
) {
  const store = new NotificationSettingsStore(":memory:");
  try {
    await fn(store);
  } finally {
    await store.close();
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
