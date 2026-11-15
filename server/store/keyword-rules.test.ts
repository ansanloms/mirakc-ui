import assert from "node:assert/strict";
import { test } from "node:test";
import { createKeywordRuleStore, type KeywordRuleStore } from "./keyword-rules.ts";
import { createKv } from "./kv.ts";
import type { KeywordRuleInput } from "../lib/keyword-rules.ts";

function input(overrides: Partial<KeywordRuleInput> = {}): KeywordRuleInput {
  return {
    keyword: "ニュース",
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

test("list: 空の KV では空配列", async () => {
  await withStore(async (store) => {
    assert.deepStrictEqual(await store.list(), []);
  });
});

test("add: ルールを保存し list は新しい順に返す", async () => {
  await withStore(async (store) => {
    const a = await store.add(input({ keyword: "古い" }), 1_000);
    const b = await store.add(input({ keyword: "新しい" }), 2_000);

    assert.deepStrictEqual(a.keyword, "古い");
    assert.deepStrictEqual(a.createdAt, 1_000);
    assert.deepStrictEqual(typeof a.id, "string");

    assert.deepStrictEqual(await store.list(), [b, a]);
  });
});

test("add: 条件付きルールの全項目を保存する", async () => {
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
    assert.deepStrictEqual((await store.list())[0], rule);
    assert.deepStrictEqual(rule.from, "2026-01-01T00:00:00+09:00");
    assert.deepStrictEqual(rule.channels, ["27"]);
    assert.deepStrictEqual(rule.genres, [3]);
    assert.deepStrictEqual(rule.enabled, false);
  });
});

test("update: 既存ルールを上書きし、無ければ null", async () => {
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
    assert.deepStrictEqual(updated?.id, rule.id);
    assert.deepStrictEqual(updated?.createdAt, 1_000);
    assert.deepStrictEqual(updated?.enabled, false);
    assert.deepStrictEqual(updated?.genres, [0]);
    assert.deepStrictEqual(await store.list(), [updated]);

    assert.deepStrictEqual(await store.update("missing", input()), null);
  });
});

test("remove: 削除で true、無ければ false", async () => {
  await withStore(async (store) => {
    const rule = await store.add(input(), 0);
    assert.deepStrictEqual(await store.remove(rule.id), true);
    assert.deepStrictEqual(await store.list(), []);
    assert.deepStrictEqual(await store.remove(rule.id), false);
  });
});

test("list: 旧 serviceIds 形式は channels:[] にフォールバックする", async () => {
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
    assert.deepStrictEqual(rules.length, 1);
    assert.deepStrictEqual(rules[0].channels, []);
    // 旧キーは均しで除かれる。
    assert.deepStrictEqual("serviceIds" in rules[0], false);
  } finally {
    await kv.close();
  }
});
