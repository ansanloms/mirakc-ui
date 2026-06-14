import { assertEquals } from "@std/assert";
import {
  createKeywordRuleStore,
  type KeywordRuleStore,
} from "./keyword-rules.ts";
import { createKv } from "./kv.ts";
import type { KeywordRuleInput } from "../lib/keyword-rules.ts";

function input(overrides: Partial<KeywordRuleInput> = {}): KeywordRuleInput {
  return {
    keyword: "ニュース",
    from: undefined,
    to: undefined,
    channels: [],
    genres: [],
    enabled: true,
    ...overrides,
  };
}

async function withStore(fn: (store: KeywordRuleStore) => Promise<void>) {
  const kv = createKv(":memory:");
  try {
    await fn(createKeywordRuleStore(kv));
  } finally {
    await kv.close();
  }
}

Deno.test("list: 空の KV では空配列", async () => {
  await withStore(async (store) => {
    assertEquals(await store.list(), []);
  });
});

Deno.test("add: ルールを保存し list は新しい順に返す", async () => {
  await withStore(async (store) => {
    const a = await store.add(input({ keyword: "古い" }), 1_000);
    const b = await store.add(input({ keyword: "新しい" }), 2_000);

    assertEquals(a.keyword, "古い");
    assertEquals(a.createdAt, 1_000);
    assertEquals(typeof a.id, "string");

    assertEquals(await store.list(), [b, a]);
  });
});

Deno.test("add: 条件付きルールの全項目を保存する", async () => {
  await withStore(async (store) => {
    const rule = await store.add(
      input({
        keyword: "ドラマ",
        from: "2026-01-01T00:00:00+09:00",
        to: "2026-01-31T23:59:59+09:00",
        channels: ["27"],
        genres: [3],
        enabled: false,
      }),
      0,
    );
    assertEquals((await store.list())[0], rule);
    assertEquals(rule.from, "2026-01-01T00:00:00+09:00");
    assertEquals(rule.channels, ["27"]);
    assertEquals(rule.genres, [3]);
    assertEquals(rule.enabled, false);
  });
});

Deno.test("update: 既存ルールを上書きし、無ければ null", async () => {
  await withStore(async (store) => {
    const rule = await store.add(input(), 1_000);

    const updated = await store.update(
      rule.id,
      input({
        keyword: "ニュース",
        enabled: false,
        genres: [0],
      }),
    );
    assertEquals(updated?.id, rule.id);
    assertEquals(updated?.createdAt, 1_000);
    assertEquals(updated?.enabled, false);
    assertEquals(updated?.genres, [0]);
    assertEquals(await store.list(), [updated]);

    assertEquals(await store.update("missing", input()), null);
  });
});

Deno.test("remove: 削除で true、無ければ false", async () => {
  await withStore(async (store) => {
    const rule = await store.add(input(), 0);
    assertEquals(await store.remove(rule.id), true);
    assertEquals(await store.list(), []);
    assertEquals(await store.remove(rule.id), false);
  });
});

Deno.test("list: 旧 serviceIds 形式は channels:[] にフォールバックする", async () => {
  const kv = createKv(":memory:");
  try {
    const store = createKeywordRuleStore(kv);
    // チャンネル条件を service 単位から channel 単位へ移行する前の保存形。
    // service→channel の解決はここでは出来ないため全チャンネル扱いに均す。
    await kv.set(["settings", "keyword-rules", "legacy-1"], {
      id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      keyword: "旧ルール",
      serviceIds: [3273601024],
      genres: [],
      enabled: true,
      createdAt: 0,
    });

    const rules = await store.list();
    assertEquals(rules.length, 1);
    assertEquals(rules[0].channels, []);
    // 旧キーは均しで除かれる。
    assertEquals("serviceIds" in rules[0], false);
  } finally {
    await kv.close();
  }
});
