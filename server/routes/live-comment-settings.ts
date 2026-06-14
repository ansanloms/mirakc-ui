import { Hono } from "hono";
import {
  type ChannelMapping,
  LIVE_COMMENT_SOURCE_IDS,
  type LiveCommentSettings,
  type LiveCommentSourceId,
  parseLiveCommentSettingsInput,
} from "../lib/live-comment-settings.ts";
import { jikkyoIdOf, nicoliveChannelIdOf } from "../lib/comments/jikkyo.ts";

/**
 * ルートが必要とするストア操作 (テストでフェイクに差し替えられるよう
 * 構造的に定義する)。
 */
export type LiveCommentSettingsStoreLike = {
  get(): Promise<LiveCommentSettings | null>;
  set(settings: LiveCommentSettings): Promise<LiveCommentSettings>;
};

export type LiveCommentSettingsRouteDeps = {
  /** mirakc の Web API ベース URL。未設定なら既定値・候補は空になる。 */
  mirakcApiUrl: string | undefined;
  fetchFn?: typeof fetch;
};

/** GET / の応答。client の設定フォームが使う。 */
export type LiveCommentSettingsView = {
  /** 保存済みか。false なら各取得元の割り当ては組み込み対照表からの既定値。 */
  saved: boolean;
  /** 取得元ごとの割り当て (未保存なら組み込み対照表から導出した既定値)。 */
  channels: Record<LiveCommentSourceId, ChannelMapping[]>;
  /**
   * 取得元ごとの自動補完候補。複合サービス ID (文字列キー) → 既知の
   * チャンネル ID。フォームでチャンネルを選んだときの補完に使う。
   */
  suggestions: Record<LiveCommentSourceId, Record<string, string>>;
};

type MirakcService = { id: number; networkId: number; serviceId: number };

/** 取得元ごとの「サービス → チャンネル ID」解決 (組み込み対照表)。 */
const RESOLVER: Record<
  LiveCommentSourceId,
  (networkId: number, serviceId: number) => string | null
> = {
  "nicolive": nicoliveChannelIdOf,
  "nx-jikkyo": jikkyoIdOf,
};

/**
 * 候補をそのまま既定の割り当て行にする。同一チャンネル ID に複数サービスが
 * 対応する場合 (サブチャンネル等) は先勝ちで 1 行に畳む。
 */
function defaultChannels(
  suggestions: Record<string, string>,
): ChannelMapping[] {
  const seen = new Set<string>();
  const channels: ChannelMapping[] = [];
  for (const [serviceId, channelId] of Object.entries(suggestions)) {
    if (seen.has(channelId)) {
      continue;
    }
    seen.add(channelId);
    channels.push({ serviceId: Number(serviceId), channelId, enabled: true });
  }
  return channels;
}

/**
 * 実況連携設定の API。`/api/live-comment-settings` にマウントする。
 *
 * - GET / 取得元ごとの割り当て + 自動補完候補。未保存なら組み込みの対照表
 *         (server/lib/comments/jikkyo.ts) から導出した既定値を返す
 * - PUT / 設定の全上書き保存
 */
export function createLiveCommentSettingsRoutes(
  store: LiveCommentSettingsStoreLike,
  deps: LiveCommentSettingsRouteDeps,
): Hono {
  const app = new Hono();
  const fetchFn = deps.fetchFn ?? fetch;

  const fetchServices = async (): Promise<MirakcService[]> => {
    if (deps.mirakcApiUrl === undefined) {
      return [];
    }
    try {
      const res = await fetchFn(`${deps.mirakcApiUrl}/services`);
      if (!res.ok) {
        await res.body?.cancel();
        return [];
      }
      return await res.json();
    } catch (e) {
      console.error("[live-comment-settings] failed to fetch services:", e);
      return [];
    }
  };

  app.get("/", async (c) => {
    const settings = await store.get();
    const services = await fetchServices();

    const suggestions = {
      "nicolive": {},
      "nx-jikkyo": {},
    } as Record<LiveCommentSourceId, Record<string, string>>;
    for (const service of services) {
      for (const source of LIVE_COMMENT_SOURCE_IDS) {
        const channelId = RESOLVER[source](
          service.networkId,
          service.serviceId,
        );
        if (channelId !== null) {
          suggestions[source][String(service.id)] = channelId;
        }
      }
    }

    const channels = {} as Record<LiveCommentSourceId, ChannelMapping[]>;
    for (const source of LIVE_COMMENT_SOURCE_IDS) {
      channels[source] = settings?.[source] ??
        defaultChannels(suggestions[source]);
    }

    const view: LiveCommentSettingsView = {
      saved: settings !== null,
      channels,
      suggestions,
    };
    return c.json(view);
  });

  app.put("/", async (c) => {
    let parsed: ReturnType<typeof parseLiveCommentSettingsInput>;
    try {
      parsed = parseLiveCommentSettingsInput(await c.req.json());
    } catch {
      parsed = { ok: false, error: "invalid JSON body" };
    }
    if (!parsed.ok) {
      return c.json({ error: parsed.error }, 400);
    }
    return c.json(await store.set(parsed.input));
  });

  return app;
}
