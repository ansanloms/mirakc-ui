import { assertEquals } from "@std/assert";
import {
  createLiveCommentSettingsStore,
  type LiveCommentSettingsStore,
} from "./live-comment-settings.ts";
import { createKv, type Kv } from "./kv.ts";

async function withStore(
  fn: (store: LiveCommentSettingsStore, kv: Kv) => Promise<void>,
) {
  const kv = createKv(":memory:");
  try {
    await fn(createLiveCommentSettingsStore(kv), kv);
  } finally {
    await kv.close();
  }
}

Deno.test("get: 未保存なら null (組み込み対照表へのフォールバック)", async () => {
  await withStore(async (store) => {
    assertEquals(await store.get(), null);
  });
});

Deno.test("set: 取得元ごとの割り当てを保存して get で読める", async () => {
  await withStore(async (store) => {
    const settings = {
      nicolive: [{
        serviceId: 3273601024,
        channelId: "ch2646436",
        enabled: true,
      }],
      "nx-jikkyo": [{ serviceId: 3273601024, channelId: "jk1", enabled: true }],
    };
    await store.set(settings);
    assertEquals(await store.get(), settings);
  });
});

Deno.test("get: 壊れた保存値は null 扱い", async () => {
  await withStore(async (store, kv) => {
    await kv.set(["settings", "live-comment"], { nicolive: "broken" });
    assertEquals(await store.get(), null);
  });
});
