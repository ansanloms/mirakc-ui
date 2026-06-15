import { assertEquals } from "@std/assert";
import {
  createLiveCommentMappingStore,
  type LiveCommentMappingStore,
} from "./live-comment-settings.ts";
import { createKv, type Kv } from "./kv.ts";
import type { LiveCommentMappingInput } from "../lib/live-comment-settings.ts";

function input(
  overrides: Partial<LiveCommentMappingInput> = {},
): LiveCommentMappingInput {
  return {
    channel: "27",
    assignments: [{ source: "nx-jikkyo", channelId: "jk1" }],
    enabled: true,
    ...overrides,
  };
}

async function withStore(
  fn: (store: LiveCommentMappingStore, kv: Kv) => Promise<void>,
) {
  const kv = createKv(":memory:");
  try {
    await fn(createLiveCommentMappingStore(kv), kv);
  } finally {
    await kv.close();
  }
}

Deno.test("list: 空の KV では空配列", async () => {
  await withStore(async (store) => {
    assertEquals(await store.list(), []);
  });
});

Deno.test("add: 割り当てを保存し id / createdAt を採番、list は新しい順", async () => {
  await withStore(async (store) => {
    const a = await store.add(input({ channel: "27" }), 1_000);
    const b = await store.add(input({ channel: "26" }), 2_000);
    assertEquals(typeof a.id, "string");
    assertEquals(a.createdAt, 1_000);
    const list = await store.list();
    assertEquals(list.map((m) => m.channel), ["26", "27"]);
    assertEquals(list[0].id, b.id);
  });
});

Deno.test("update: 既存は上書き (id / createdAt 維持)、無ければ null", async () => {
  await withStore(async (store) => {
    const a = await store.add(input({ channel: "27" }), 1_000);
    const updated = await store.update(
      a.id,
      input({ channel: "27", enabled: false }),
    );
    assertEquals(updated?.id, a.id);
    assertEquals(updated?.createdAt, 1_000);
    assertEquals(updated?.enabled, false);
    assertEquals(await store.update("missing", input()), null);
  });
});

Deno.test("remove: 削除で true、無ければ false", async () => {
  await withStore(async (store) => {
    const a = await store.add(input());
    assertEquals(await store.remove(a.id), true);
    assertEquals(await store.remove(a.id), false);
    assertEquals(await store.list(), []);
  });
});

Deno.test("list: 壊れた保存値は除外する", async () => {
  await withStore(async (store, kv) => {
    const a = await store.add(input());
    // prefix 配下に旧形状・壊れた値を直接置く。
    await kv.set(["settings", "live-comment", "broken"], { nicolive: [] });
    const list = await store.list();
    assertEquals(list.map((m) => m.id), [a.id]);
  });
});
