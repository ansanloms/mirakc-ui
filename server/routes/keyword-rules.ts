import { Hono } from "hono";
import {
  type KeywordRule,
  type KeywordRuleInput,
  parseKeywordRuleInput,
} from "../lib/keyword-rules.ts";

/**
 * ルートが必要とするストア操作。KeywordRuleStore (Deno KV) のサブセット
 * (テストでフェイクに差し替えられるよう構造的に定義する)。
 */
export type KeywordRuleStoreLike = {
  list(): Promise<KeywordRule[]>;
  add(input: KeywordRuleInput): Promise<KeywordRule>;
  update(id: string, input: KeywordRuleInput): Promise<KeywordRule | null>;
  remove(id: string): Promise<boolean>;
};

/**
 * キーワード自動録画ルールの CRUD API。`/api/keyword-rules` にマウントする。
 *
 * - GET    /     ルール一覧
 * - POST   /     ルール追加 (body: KeywordRuleInput)
 * - PUT    /:id  ルール更新 (有効/停止トグル含む全項目上書き)
 * - DELETE /:id  ルール削除
 */
export function createKeywordRulesRoutes(
  store: KeywordRuleStoreLike,
): Hono {
  const app = new Hono();

  const parseBody = async (
    c: { req: { json(): Promise<unknown> } },
  ): Promise<ReturnType<typeof parseKeywordRuleInput>> => {
    try {
      return parseKeywordRuleInput(await c.req.json());
    } catch {
      return { ok: false, error: "invalid JSON body" };
    }
  };

  app.get("/", async (c) => {
    return c.json(await store.list());
  });

  app.post("/", async (c) => {
    const parsed = await parseBody(c);
    if (!parsed.ok) {
      return c.json({ error: parsed.error }, 400);
    }
    return c.json(await store.add(parsed.input), 201);
  });

  app.put("/:id", async (c) => {
    const parsed = await parseBody(c);
    if (!parsed.ok) {
      return c.json({ error: parsed.error }, 400);
    }
    const updated = await store.update(c.req.param("id"), parsed.input);
    if (updated === null) {
      return c.json({ error: "rule not found" }, 404);
    }
    return c.json(updated);
  });

  app.delete("/:id", async (c) => {
    const removed = await store.remove(c.req.param("id"));
    if (!removed) {
      return c.json({ error: "rule not found" }, 404);
    }
    return c.body(null, 204);
  });

  return app;
}
