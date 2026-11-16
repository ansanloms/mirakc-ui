import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createLiveCommentMappingStore,
  type LiveCommentMappingStore,
} from "./live-comment-settings.ts";
import { createKv, type Kv } from "./kv.ts";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isValidChannelId, type LiveCommentMappingInput } from "../lib/live-comment-settings.ts";

function input(overrides: Partial<LiveCommentMappingInput> = {}): LiveCommentMappingInput {
  return {
    channel: "27",
    assignments: [{ source: "nx-jikkyo", channelId: "jk1" }],
    enabled: true,
    ...overrides,
  };
}

async function withStore(fn: (store: LiveCommentMappingStore, kv: Kv) => Promise<void>) {
  const kv = createKv(":memory:");
  try {
    await fn(createLiveCommentMappingStore(kv), kv);
  } finally {
    await kv.close();
  }
}

test("list: 空の KV では空配列", async () => {
  await withStore(async (store) => {
    assert.deepStrictEqual(await store.list(), []);
  });
});

test("add: 割り当てを保存し id / createdAt を採番、list は新しい順", async () => {
  await withStore(async (store) => {
    const a = await store.add(input({ channel: "27" }), 1_000);
    const b = await store.add(input({ channel: "26" }), 2_000);
    assert.deepStrictEqual(typeof a.id, "string");
    assert.deepStrictEqual(a.createdAt, 1_000);
    const list = await store.list();
    assert.deepStrictEqual(
      list.map((m) => m.channel),
      ["26", "27"],
    );
    assert.deepStrictEqual(list[0].id, b.id);
  });
});

test("update: 既存は上書き (id / createdAt 維持)、無ければ null", async () => {
  await withStore(async (store) => {
    const a = await store.add(input({ channel: "27" }), 1_000);
    const updated = await store.update(a.id, input({ channel: "27", enabled: false }));
    assert.deepStrictEqual(updated?.id, a.id);
    assert.deepStrictEqual(updated?.createdAt, 1_000);
    assert.deepStrictEqual(updated?.enabled, false);
    assert.deepStrictEqual(await store.update("missing", input()), null);
  });
});

test("remove: 削除で true、無ければ false", async () => {
  await withStore(async (store) => {
    const a = await store.add(input());
    assert.deepStrictEqual(await store.remove(a.id), true);
    assert.deepStrictEqual(await store.remove(a.id), false);
    assert.deepStrictEqual(await store.list(), []);
  });
});

test("list: 壊れた保存値は除外する", async () => {
  await withStore(async (store, kv) => {
    const a = await store.add(input());
    // prefix 配下に旧形状・壊れた値を直接置く。
    await kv.set(["settings", "live-comment", "broken"], { nicolive: [] });
    const list = await store.list();
    assert.deepStrictEqual(
      list.map((m) => m.id),
      [a.id],
    );
  });
});

test("同梱の init SQL: 新規 DB に関東 9 件が入り、全行が検証を通る", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mirakc-ui-lc-"));
  const kv = createKv(`${dir}/settings.sqlite3`, {
    initDir: join(import.meta.dirname, "../initdb.d"),
  });
  try {
    const list = await createLiveCommentMappingStore(kv).list();
    assert.deepStrictEqual(list.length, 9);
    for (const mapping of list) {
      assert.deepStrictEqual(mapping.enabled, true);
      assert.deepStrictEqual(mapping.assignments.length, 2);
      for (const a of mapping.assignments) {
        assert.deepStrictEqual(isValidChannelId(a.source, a.channelId), true);
      }
    }
    assert.deepStrictEqual(list[0].channel, "27");
    assert.deepStrictEqual(list[8].channel, "BS15_0");
  } finally {
    await kv.close();
    await rm(dir, { recursive: true, force: true });
  }
});
