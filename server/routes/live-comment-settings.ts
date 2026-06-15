import { Hono } from "hono";
import {
  type LiveCommentMapping,
  type LiveCommentMappingInput,
  parseLiveCommentMappingInput,
} from "../lib/live-comment-settings.ts";

/**
 * ルートが必要とするストア操作。LiveCommentMappingStore (Deno KV) のサブセット
 * (テストでフェイクに差し替えられるよう構造的に定義する)。
 */
export type LiveCommentMappingStoreLike = {
  list(): Promise<LiveCommentMapping[]>;
  add(input: LiveCommentMappingInput): Promise<LiveCommentMapping>;
  update(
    id: string,
    input: LiveCommentMappingInput,
  ): Promise<LiveCommentMapping | null>;
  remove(id: string): Promise<boolean>;
};

/**
 * 実況連携設定の CRUD API。`/api/live-comment-settings` にマウントする。
 *
 * - GET    /     割り当て一覧
 * - POST   /     割り当て追加 (body: LiveCommentMappingInput)
 * - PUT    /:id  割り当て更新 (全項目上書き)
 * - DELETE /:id  割り当て削除
 *
 * 同一 channel の重複は許す (keyword-rules と同じ素の CRUD)。1 チャンネルに複数
 * エントリが並んでも、コメント解決側で取得元・ID を uniq する想定。
 */
export function createLiveCommentSettingsRoutes(
  store: LiveCommentMappingStoreLike,
): Hono {
  const app = new Hono();

  const parseBody = async (
    c: { req: { json(): Promise<unknown> } },
  ): Promise<ReturnType<typeof parseLiveCommentMappingInput>> => {
    try {
      return parseLiveCommentMappingInput(await c.req.json());
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
    const mapping = await store.add(parsed.input);
    return c.json(mapping, 201);
  });

  app.put("/:id", async (c) => {
    const parsed = await parseBody(c);
    if (!parsed.ok) {
      return c.json({ error: parsed.error }, 400);
    }
    const updated = await store.update(c.req.param("id"), parsed.input);
    if (updated === null) {
      return c.json({ error: "mapping not found" }, 404);
    }
    return c.json(updated);
  });

  app.delete("/:id", async (c) => {
    const removed = await store.remove(c.req.param("id"));
    if (!removed) {
      return c.json({ error: "mapping not found" }, 404);
    }
    return c.body(null, 204);
  });

  return app;
}
