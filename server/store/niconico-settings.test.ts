import { assertEquals } from "@std/assert";
import { NiconicoSettingsStore } from "./niconico-settings.ts";
import { Kv } from "./kv.ts";

async function withStore(
  fn: (store: NiconicoSettingsStore, kv: Kv) => Promise<void>,
) {
  const kv = new Kv(":memory:");
  try {
    await fn(new NiconicoSettingsStore(kv), kv);
  } finally {
    await kv.close();
  }
}

Deno.test("get: 未保存なら null (組み込み対照表へのフォールバック)", async () => {
  await withStore(async (store) => {
    assertEquals(await store.get(), null);
  });
});

Deno.test("set: 保存した値を get で読める", async () => {
  await withStore(async (store) => {
    const settings = {
      channels: [{ serviceId: 3273601024, nicoliveChannelId: "ch2646436" }],
    };
    await store.set(settings);
    assertEquals(await store.get(), settings);
  });
});

Deno.test("get: 壊れた保存値は null 扱い", async () => {
  await withStore(async (store, kv) => {
    await kv.set(["settings", "niconico"], { channels: "broken" });
    assertEquals(await store.get(), null);
  });
});
