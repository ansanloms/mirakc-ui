import { assertEquals } from "@std/assert";
import { NotificationSettingsStore } from "./notification-settings.ts";
import { Kv } from "./kv.ts";
import { DEFAULT_NOTIFICATION_SETTINGS } from "../lib/notification-settings.ts";

const settingsOf = (
  overrides: Partial<typeof DEFAULT_NOTIFICATION_SETTINGS> = {},
) => ({
  ...DEFAULT_NOTIFICATION_SETTINGS,
  ...overrides,
});

async function withStore(
  fn: (store: NotificationSettingsStore, kv: Kv) => Promise<void>,
) {
  const kv = new Kv(":memory:");
  try {
    await fn(new NotificationSettingsStore(kv), kv);
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
    const settings = settingsOf({
      url: "https://ntfy.sh/mirakc-rec",
      token: "tk_abc",
      onSchedule: true,
      onStart: true,
      onFail: true,
    });
    const saved = await store.set(settings);
    assertEquals(saved, settings);
    assertEquals(await store.get(), settings);
  });
});

Deno.test("set: 全上書きする (前回値とのマージはしない)", async () => {
  await withStore(async (store) => {
    await store.set(
      settingsOf({ url: "https://ntfy.sh/a", token: "tk", onStart: true }),
    );
    const next = settingsOf();
    await store.set(next);
    assertEquals(await store.get(), next);
  });
});

Deno.test("get: トグル追加前の旧形状の保存値は false 補完で返す", async () => {
  await withStore(async (store, kv) => {
    // 旧バージョンが保存した 4 フィールドの値を KV に直接入れる。
    await kv.set(["settings", "notification"], {
      url: "https://ntfy.sh/legacy",
      token: "tk_legacy",
      onStart: true,
      onEnd: true,
    });

    assertEquals(await store.get(), {
      url: "https://ntfy.sh/legacy",
      token: "tk_legacy",
      onSchedule: false,
      onStart: true,
      onEnd: true,
      onFail: false,
      onRemove: false,
    });
  });
});

Deno.test("複数 store が同じ Kv を共有できる", async () => {
  const kv = new Kv(":memory:");
  try {
    const a = new NotificationSettingsStore(kv);
    const b = new NotificationSettingsStore(kv);
    await a.set(settingsOf({ url: "https://ntfy.sh/x", onStart: true }));
    assertEquals((await b.get()).url, "https://ntfy.sh/x");
  } finally {
    await kv.close();
  }
});
