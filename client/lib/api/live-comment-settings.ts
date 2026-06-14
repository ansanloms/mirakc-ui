/**
 * 実況連携設定 API (/api/live-comment-settings) のクライアント。
 *
 * mirakc-ui 自身の Hono が提供するため $api (mirakc の OpenAPI 由来) には
 * 含まれない。素の fetch を薄くラップし、型は server 側から共有する。
 */
import type {
  ChannelMapping,
  LiveCommentSettings,
  LiveCommentSettingsView,
  LiveCommentSourceId,
} from "../../../server/lib/live-comment-settings.ts";

export type {
  ChannelMapping,
  LiveCommentSettings,
  LiveCommentSettingsView,
  LiveCommentSourceId,
};

const BASE_PATH = "/api/live-comment-settings";

async function ensureOk(res: Response): Promise<Response> {
  if (!res.ok) {
    await res.body?.cancel();
    throw new Error(`live-comment-settings api failed: ${res.status}`);
  }
  return res;
}

/** 設定 + 自動補完候補を取得する (未保存なら組み込み対照表からの既定値)。 */
export async function fetchLiveCommentSettings(
  fetchFn: typeof fetch = fetch,
): Promise<LiveCommentSettingsView> {
  const res = await ensureOk(await fetchFn(BASE_PATH));
  return await res.json();
}

/** 設定を保存する (全上書き)。 */
export async function saveLiveCommentSettings(
  settings: LiveCommentSettings,
  fetchFn: typeof fetch = fetch,
): Promise<LiveCommentSettings> {
  const res = await ensureOk(
    await fetchFn(BASE_PATH, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(settings),
    }),
  );
  return await res.json();
}
