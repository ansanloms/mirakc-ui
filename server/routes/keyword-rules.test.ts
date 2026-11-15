import assert from "node:assert/strict";
import { test } from "node:test";
import { createKeywordRulesRoutes } from "./keyword-rules.ts";
import type { KeywordRule, KeywordRuleInput } from "../lib/keyword-rules.ts";

function fakeStore(initial: KeywordRule[] = []) {
  const rules = [...initial];
  return {
    rules,
    list: () => Promise.resolve([...rules]),
    add: (input: KeywordRuleInput, now: number = 0) => {
      const rule: KeywordRule = {
        ...input,
        id: `id-${rules.length}`,
        createdAt: now,
      };
      rules.push(rule);
      return Promise.resolve(rule);
    },
    update: (id: string, input: KeywordRuleInput) => {
      const index = rules.findIndex((rule) => rule.id === id);
      if (index < 0) {
        return Promise.resolve(null);
      }
      rules[index] = { ...input, id, createdAt: rules[index].createdAt };
      return Promise.resolve(rules[index]);
    },
    remove: (id: string) => {
      const index = rules.findIndex((rule) => rule.id === id);
      if (index < 0) {
        return Promise.resolve(false);
      }
      rules.splice(index, 1);
      return Promise.resolve(true);
    },
  };
}

function ruleOf(overrides: Partial<KeywordRule> = {}): KeywordRule {
  return {
    id: "a",
    keyword: "ニュース",
    channels: [],
    genres: [],
    enabled: true,
    createdAt: 1,
    ...overrides,
  };
}

test("GET /: ルール一覧を返す", async () => {
  const rule = ruleOf();
  const app = createKeywordRulesRoutes(fakeStore([rule]));

  const res = await app.request("/");
  assert.deepStrictEqual(res.status, 200);
  assert.deepStrictEqual(await res.json(), [rule]);
});

test("POST /: ルールを追加して 201 を返す", async () => {
  const store = fakeStore();
  const app = createKeywordRulesRoutes(store);

  const res = await app.request("/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      keyword: " ドキュメンタリー ",
      from: "2026-01-01T00:00:00+09:00",
      channels: ["27"],
      genres: [8],
    }),
  });
  assert.deepStrictEqual(res.status, 201);
  const body = await res.json();
  assert.deepStrictEqual(body.keyword, "ドキュメンタリー");
  assert.deepStrictEqual(body.from, "2026-01-01T00:00:00+09:00");
  assert.deepStrictEqual(body.channels, ["27"]);
  assert.deepStrictEqual(body.genres, [8]);
  assert.deepStrictEqual(body.enabled, true);
  assert.deepStrictEqual(store.rules.length, 1);
});

test("POST /: 不正な入力は 400", async () => {
  const app = createKeywordRulesRoutes(fakeStore());

  const bodies = [
    {},
    { keyword: "" },
    {
      keyword: "x",
      from: "2026-01-02T00:00:00+09:00",
      to: "2026-01-01T23:59:59+09:00",
    },
    { keyword: "x", genres: [99] },
  ];
  for (const body of bodies) {
    const res = await app.request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    assert.deepStrictEqual(res.status, 400, JSON.stringify(body));
    await res.body?.cancel();
  }
});

test("PUT /:id: ルールを更新して 200、無ければ 404", async () => {
  const store = fakeStore([ruleOf()]);
  const app = createKeywordRulesRoutes(store);

  const res = await app.request("/a", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ keyword: "ニュース", enabled: false }),
  });
  assert.deepStrictEqual(res.status, 200);
  const body = await res.json();
  assert.deepStrictEqual(body.id, "a");
  assert.deepStrictEqual(body.enabled, false);
  assert.deepStrictEqual(body.createdAt, 1);

  const missing = await app.request("/missing", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ keyword: "ニュース" }),
  });
  assert.deepStrictEqual(missing.status, 404);
  await missing.body?.cancel();

  const invalid = await app.request("/a", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ keyword: "" }),
  });
  assert.deepStrictEqual(invalid.status, 400);
  await invalid.body?.cancel();
});

test("DELETE /:id: 削除で 204、無ければ 404", async () => {
  const app = createKeywordRulesRoutes(fakeStore([ruleOf()]));

  const deleted = await app.request("/a", { method: "DELETE" });
  assert.deepStrictEqual(deleted.status, 204);

  const missing = await app.request("/a", { method: "DELETE" });
  assert.deepStrictEqual(missing.status, 404);
  await missing.body?.cancel();
});

test("onChanged: 登録・更新の成功時のみ発火する", async () => {
  let changed = 0;
  const app = createKeywordRulesRoutes(fakeStore([ruleOf()]), {
    onChanged: () => changed++,
  });

  // GET では発火しない。
  await (await app.request("/")).body?.cancel();
  assert.deepStrictEqual(changed, 0);

  // POST 成功で発火。
  await (
    await app.request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ keyword: "ニュース" }),
    })
  ).body?.cancel();
  assert.deepStrictEqual(changed, 1);

  // POST 失敗 (400) では発火しない。
  await (
    await app.request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ keyword: "" }),
    })
  ).body?.cancel();
  assert.deepStrictEqual(changed, 1);

  // PUT 成功で発火、404 では発火しない。
  await (
    await app.request("/a", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ keyword: "ニュース", enabled: true }),
    })
  ).body?.cancel();
  assert.deepStrictEqual(changed, 2);

  await (
    await app.request("/missing", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ keyword: "ニュース" }),
    })
  ).body?.cancel();
  assert.deepStrictEqual(changed, 2);

  // DELETE では発火しない (予約の取り消しはしない仕様のため再実行も不要)。
  await (await app.request("/a", { method: "DELETE" })).body?.cancel();
  assert.deepStrictEqual(changed, 2);
});
