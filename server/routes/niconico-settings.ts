import { Hono } from "hono";
import {
  type NiconicoSettings,
  parseNiconicoSettingsInput,
} from "../lib/niconico-settings.ts";
import { nicoliveChannelIdOf } from "../lib/comments/jikkyo.ts";

/**
 * ルートが必要とするストア操作 (テストでフェイクに差し替えられるよう
 * 構造的に定義する)。
 */
export type NiconicoSettingsStoreLike = {
  get(): Promise<NiconicoSettings | null>;
  set(settings: NiconicoSettings): Promise<NiconicoSettings>;
};

export type NiconicoSettingsRouteDeps = {
  /** mirakc の Web API ベース URL。未設定なら既定値・候補は空になる。 */
  mirakcApiUrl: string | undefined;
  fetchFn?: typeof fetch;
};

/** GET / の応答。client の設定フォームが使う。 */
export type NiconicoSettingsView = {
  /** 保存済みか。false なら channels は組み込み対照表から導出した既定値。 */
  saved: boolean;
  channels: NiconicoSettings["channels"];
  /**
   * mirakc の複合サービス ID (文字列キー) → 既知のニコニコチャンネル ID。
   * フォームでチャンネルを選んだときの自動補完に使う。
   */
  suggestions: Record<string, string>;
};

type MirakcService = { id: number; networkId: number; serviceId: number };

/**
 * ニコニコ実況連携設定の API。`/api/niconico-settings` にマウントする。
 *
 * - GET / 設定 + 自動補完候補。未保存なら組み込みの対照表
 *         (server/lib/comments/jikkyo.ts) から導出した既定値を返す
 * - PUT / 設定の全上書き保存
 */
export function createNiconicoSettingsRoutes(
  store: NiconicoSettingsStoreLike,
  deps: NiconicoSettingsRouteDeps,
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
      console.error("[niconico-settings] failed to fetch services:", e);
      return [];
    }
  };

  app.get("/", async (c) => {
    const settings = await store.get();
    const services = await fetchServices();

    const suggestions: Record<string, string> = {};
    for (const service of services) {
      const channelId = nicoliveChannelIdOf(
        service.networkId,
        service.serviceId,
      );
      if (channelId !== null) {
        suggestions[String(service.id)] = channelId;
      }
    }

    // 未保存時の既定値: 候補をそのまま行にする。同一ニコニコチャンネルに
    // 複数サービスが対応する場合 (サブチャンネル等) は先勝ちで 1 行に畳む
    // (保存時の重複エラーをそのまま出さないため)。
    let channels = settings?.channels;
    if (channels === undefined) {
      const seen = new Set<string>();
      channels = [];
      for (
        const [serviceId, nicoliveChannelId] of Object.entries(suggestions)
      ) {
        if (seen.has(nicoliveChannelId)) {
          continue;
        }
        seen.add(nicoliveChannelId);
        channels.push({ serviceId: Number(serviceId), nicoliveChannelId });
      }
    }

    const view: NiconicoSettingsView = {
      saved: settings !== null,
      channels,
      suggestions,
    };
    return c.json(view);
  });

  app.put("/", async (c) => {
    let parsed: ReturnType<typeof parseNiconicoSettingsInput>;
    try {
      parsed = parseNiconicoSettingsInput(await c.req.json());
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
