import { assertEquals } from "@std/assert";
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
    serviceIds: [],
    genres: [],
    enabled: true,
    createdAt: 1,
    ...overrides,
  };
}

Deno.test("GET /: ルール一覧を返す", async () => {
  const rule = ruleOf();
  const app = createKeywordRulesRoutes(fakeStore([rule]));

  const res = await app.request("/");
  assertEquals(res.status, 200);
  assertEquals(await res.json(), [rule]);
});

Deno.test("POST /: ルールを追加して 201 を返す", async () => {
  const store = fakeStore();
  const app = createKeywordRulesRoutes(store);

  const res = await app.request("/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      keyword: " ドキュメンタリー ",
      from: "2026-01-01",
      serviceIds: [3273601024],
      genres: [8],
    }),
  });
  assertEquals(res.status, 201);
  const body = await res.json();
  assertEquals(body.keyword, "ドキュメンタリー");
  assertEquals(body.from, "2026-01-01");
  assertEquals(body.serviceIds, [3273601024]);
  assertEquals(body.genres, [8]);
  assertEquals(body.enabled, true);
  assertEquals(store.rules.length, 1);
});

Deno.test("POST /: 不正な入力は 400", async () => {
  const app = createKeywordRulesRoutes(fakeStore());

  const bodies = [
    {},
    { keyword: "" },
    { keyword: "x", from: "2026-01-02", to: "2026-01-01" },
    { keyword: "x", genres: [99] },
  ];
  for (const body of bodies) {
    const res = await app.request("/", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    assertEquals(res.status, 400, JSON.stringify(body));
    await res.body?.cancel();
  }
});

Deno.test("PUT /:id: ルールを更新して 200、無ければ 404", async () => {
  const store = fakeStore([ruleOf()]);
  const app = createKeywordRulesRoutes(store);

  const res = await app.request("/a", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ keyword: "ニュース", enabled: false }),
  });
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.id, "a");
  assertEquals(body.enabled, false);
  assertEquals(body.createdAt, 1);

  const missing = await app.request("/missing", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ keyword: "ニュース" }),
  });
  assertEquals(missing.status, 404);
  await missing.body?.cancel();

  const invalid = await app.request("/a", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ keyword: "" }),
  });
  assertEquals(invalid.status, 400);
  await invalid.body?.cancel();
});

Deno.test("DELETE /:id: 削除で 204、無ければ 404", async () => {
  const app = createKeywordRulesRoutes(fakeStore([ruleOf()]));

  const deleted = await app.request("/a", { method: "DELETE" });
  assertEquals(deleted.status, 204);

  const missing = await app.request("/a", { method: "DELETE" });
  assertEquals(missing.status, 404);
  await missing.body?.cancel();
});

Deno.test("onChanged: 登録・更新の成功時のみ発火する", async () => {
  let changed = 0;
  const app = createKeywordRulesRoutes(fakeStore([ruleOf()]), {
    onChanged: () => changed++,
  });

  // GET では発火しない。
  await (await app.request("/")).body?.cancel();
  assertEquals(changed, 0);

  // POST 成功で発火。
  await (await app.request("/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ keyword: "ニュース" }),
  })).body?.cancel();
  assertEquals(changed, 1);

  // POST 失敗 (400) では発火しない。
  await (await app.request("/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ keyword: "" }),
  })).body?.cancel();
  assertEquals(changed, 1);

  // PUT 成功で発火、404 では発火しない。
  await (await app.request("/a", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ keyword: "ニュース", enabled: true }),
  })).body?.cancel();
  assertEquals(changed, 2);

  await (await app.request("/missing", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ keyword: "ニュース" }),
  })).body?.cancel();
  assertEquals(changed, 2);

  // DELETE では発火しない (予約の取り消しはしない仕様のため再実行も不要)。
  await (await app.request("/a", { method: "DELETE" })).body?.cancel();
  assertEquals(changed, 2);
});
