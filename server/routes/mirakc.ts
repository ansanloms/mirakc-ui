import { Hono } from "hono";
import { mirakcApiUrlOf } from "../lib/mirakc.ts";
import type { ProgramInfo } from "../lib/mirakc-events.ts";

/** POST /recording/schedules の応答 (WebRecordingSchedule) のサブセット。 */
export type CreatedSchedule = {
  program: ProgramInfo & { id: number };
};

/**
 * 録画予約の登録・削除を検知するフック。mirakc には予約の登録/削除を表す
 * SSE イベントが無いため、プロキシを通る操作 (UI からの手動操作) を
 * ここで拾って通知につなげる。転送応答を遅らせないよう await しない
 * (エラー処理はフック実装側の責務)。
 */
export type MirakcProxyHooks = {
  /** `POST /recording/schedules` 成功時 (録画予約の登録)。 */
  onScheduleCreated?: (schedule: CreatedSchedule) => void | Promise<unknown>;

  /** `DELETE /recording/schedules/{program_id}` 成功時 (予約の削除)。 */
  onScheduleRemoved?: (programId: number) => void | Promise<unknown>;
};

export type MirakcProxyOptions = {
  /** mirakc のベース URL (`MIRAKC_URL`)。未設定なら全リクエスト 500。 */
  mirakcUrl?: string;

  hooks?: MirakcProxyHooks;

  fetchFn?: typeof fetch;
};

/** 転送成功後にフックを発火する。フックの失敗は転送応答に影響させない。 */
function dispatchHooks(
  hooks: MirakcProxyHooks,
  method: string,
  subPath: string,
  res: Response,
): void {
  if (
    method === "POST" && subPath === "/recording/schedules" &&
    hooks.onScheduleCreated !== undefined
  ) {
    const onScheduleCreated = hooks.onScheduleCreated;
    // 応答 body はクライアントへ流すため clone 側を読む。
    res.clone().json()
      .then((schedule: CreatedSchedule) => onScheduleCreated(schedule))
      .catch((e) =>
        console.error("[mirakc-proxy] schedule-created hook failed:", e)
      );
    return;
  }

  if (method === "DELETE" && hooks.onScheduleRemoved !== undefined) {
    const matched = subPath.match(/^\/recording\/schedules\/(\d+)$/);
    if (matched !== null) {
      const onScheduleRemoved = hooks.onScheduleRemoved;
      Promise.resolve()
        .then(() => onScheduleRemoved(Number(matched[1])))
        .catch((e) =>
          console.error("[mirakc-proxy] schedule-removed hook failed:", e)
        );
    }
  }
}

/**
 * mirakc バックエンドへのプロキシ。`/api/mirakc/*` を `MIRAKC_URL` の
 * Web API (`${MIRAKC_URL}/api`) 配下へそのまま転送する。CORS 回避のため
 * サーバサイドプロキシとして機能する。`app.route("/api/mirakc", ...)` で
 * マウントするため、ここでのパスは `/*` がサブパスに対応する。
 */
export function createMirakcProxy(options: MirakcProxyOptions = {}): Hono {
  const { mirakcUrl, hooks = {}, fetchFn = fetch } = options;
  const app = new Hono();

  app.all("/*", async (c) => {
    if (!mirakcUrl) {
      return c.json({ error: "MIRAKC_URL is not set" }, 500);
    }

    // マウントポイント (/api/mirakc) を除いたサブパス + クエリを上流 URL に連結する。
    const url = new URL(c.req.url);
    const subPath = url.pathname.replace(/^\/api\/mirakc/, "");
    const target = mirakcApiUrlOf(mirakcUrl) + subPath + url.search;

    const res = await fetchFn(target, {
      method: c.req.method,
      headers: c.req.raw.headers,
      body: c.req.method === "GET" || c.req.method === "HEAD"
        ? undefined
        : c.req.raw.body,
    });

    if (res.ok) {
      dispatchHooks(hooks, c.req.method, subPath, res);
    }

    return new Response(res.body, {
      status: res.status,
      headers: res.headers,
    });
  });

  return app;
}
