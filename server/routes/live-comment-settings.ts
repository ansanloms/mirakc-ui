import { Hono } from "hono";
import {
  type LiveCommentAssignment,
  LIVE_COMMENT_SOURCE_IDS,
  type LiveCommentMapping,
  type LiveCommentMappingInput,
  type LiveCommentSourceId,
  type LiveCommentSuggestion,
  parseLiveCommentMappingInput,
} from "../lib/live-comment-settings.ts";
import { jikkyoIdOf, nicoliveChannelIdOf } from "../lib/comments/jikkyo.ts";

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

export type LiveCommentSettingsRouteDeps = {
  /** mirakc の Web API ベース URL。未設定なら候補は空になる。 */
  mirakcApiUrl: string | undefined;
  fetchFn?: typeof fetch;
};

type MirakcChannel = {
  channel: string;
  services: { networkId: number; serviceId: number }[];
};

/** 取得元ごとの「サービス → 実況チャンネル ID」解決 (組み込み対照表)。 */
const RESOLVER: Record<
  LiveCommentSourceId,
  (networkId: number, serviceId: number) => string | null
> = {
  "nicolive": nicoliveChannelIdOf,
  "nx-jikkyo": jikkyoIdOf,
};

/**
 * チャンネル一覧を組み込み対照表で解決し、チャンネルごとの割り当て候補にする。
 * チャンネル配下のサービスを横断して取得元ごとに解決し、(取得元, ID) で重複を
 * 畳む。候補が 1 つも無いチャンネルは除く。
 */
function buildSuggestions(channels: MirakcChannel[]): LiveCommentSuggestion[] {
  const result: LiveCommentSuggestion[] = [];
  for (const channel of channels) {
    const seen = new Map<string, LiveCommentAssignment>();
    for (const service of channel.services) {
      for (const source of LIVE_COMMENT_SOURCE_IDS) {
        const channelId = RESOLVER[source](
          service.networkId,
          service.serviceId,
        );
        if (channelId === null) {
          continue;
        }
        const key = `${source}:${channelId}`;
        if (!seen.has(key)) {
          seen.set(key, { source, channelId });
        }
      }
    }
    if (seen.size > 0) {
      result.push({ channel: channel.channel, assignments: [...seen.values()] });
    }
  }
  return result;
}

/**
 * 実況連携設定の CRUD API。`/api/live-comment-settings` にマウントする。
 *
 * - GET    /            割り当て一覧
 * - GET    /suggestions 組み込み対照表からの自動補完候補 (mirakc の /channels から導出)
 * - POST   /            割り当て追加 (body: LiveCommentMappingInput)
 * - PUT    /:id         割り当て更新 (全項目上書き)
 * - DELETE /:id         割り当て削除
 *
 * 同一 channel の重複登録は POST / PUT で 409 にする (1 チャンネル 1 エントリ。
 * 後続のコメント解決が channel → 割り当てを一意に引けるようにするため)。
 */
export function createLiveCommentSettingsRoutes(
  store: LiveCommentMappingStoreLike,
  deps: LiveCommentSettingsRouteDeps,
): Hono {
  const app = new Hono();
  const fetchFn = deps.fetchFn ?? fetch;

  const parseBody = async (
    c: { req: { json(): Promise<unknown> } },
  ): Promise<ReturnType<typeof parseLiveCommentMappingInput>> => {
    try {
      return parseLiveCommentMappingInput(await c.req.json());
    } catch {
      return { ok: false, error: "invalid JSON body" };
    }
  };

  const fetchChannels = async (): Promise<MirakcChannel[]> => {
    if (deps.mirakcApiUrl === undefined) {
      return [];
    }
    try {
      const res = await fetchFn(`${deps.mirakcApiUrl}/channels`);
      if (!res.ok) {
        await res.body?.cancel();
        return [];
      }
      return await res.json();
    } catch (e) {
      console.error("[live-comment-settings] failed to fetch channels:", e);
      return [];
    }
  };

  app.get("/", async (c) => {
    return c.json(await store.list());
  });

  app.get("/suggestions", async (c) => {
    return c.json(buildSuggestions(await fetchChannels()));
  });

  app.post("/", async (c) => {
    const parsed = await parseBody(c);
    if (!parsed.ok) {
      return c.json({ error: parsed.error }, 400);
    }
    const existing = await store.list();
    if (existing.some((m) => m.channel === parsed.input.channel)) {
      return c.json(
        { error: `channel already mapped: ${parsed.input.channel}` },
        409,
      );
    }
    const mapping = await store.add(parsed.input);
    return c.json(mapping, 201);
  });

  app.put("/:id", async (c) => {
    const parsed = await parseBody(c);
    if (!parsed.ok) {
      return c.json({ error: parsed.error }, 400);
    }
    const id = c.req.param("id");
    const existing = await store.list();
    // 対象が無ければ本文起因の競合 (409) より先に 404。
    if (!existing.some((m) => m.id === id)) {
      return c.json({ error: "mapping not found" }, 404);
    }
    if (existing.some((m) => m.channel === parsed.input.channel && m.id !== id)) {
      return c.json(
        { error: `channel already mapped: ${parsed.input.channel}` },
        409,
      );
    }
    const updated = await store.update(id, parsed.input);
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
