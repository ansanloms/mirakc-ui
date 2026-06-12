import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import type {
  CommentSource,
  CommentTarget,
  SourceComment,
} from "../lib/comments/types.ts";

/**
 * 実況コメントの SSE 中継 API。`/api/comments` にマウントする。
 *
 * - GET /services/:id/stream
 *     mirakc のサービス ID (複合 id) を networkId / serviceId に解決し、
 *     対応するコメントソースを束ねて SSE で中継する。イベント:
 *       - sources: 対応ソース ID の配列 (接続直後に 1 回。空配列 = 実況非対応)
 *       - comment: SourceComment の JSON
 *       - ping:    keep-alive
 *
 * ソースは SSE 接続ごとに購読する (上流購読の共有・多重化は将来課題)。
 */

export type CommentsRouteDeps = {
  /** mirakc の Web API ベース URL。undefined (MIRAKC_URL 未設定) なら 503。 */
  mirakcApiUrl: string | undefined;
  /** 利用するコメントソース。対応可否は各ソースの subscribe が判定する。 */
  sources: CommentSource[];
  fetchFn?: typeof fetch;
  /** keep-alive (ping) の送信間隔 (ms)。既定 30 秒。 */
  keepAliveMs?: number;
};

export function createCommentsRoutes(deps: CommentsRouteDeps): Hono {
  const app = new Hono();
  const fetchFn = deps.fetchFn ?? fetch;
  const keepAliveMs = deps.keepAliveMs ?? 30_000;

  app.get("/services/:id/stream", async (c) => {
    if (deps.mirakcApiUrl === undefined) {
      return c.json({ error: "MIRAKC_URL is not set" }, 503);
    }
    const id = Number(c.req.param("id"));
    if (!Number.isSafeInteger(id)) {
      return c.json({ error: "invalid service id" }, 400);
    }

    const res = await fetchFn(`${deps.mirakcApiUrl}/services/${id}`);
    if (!res.ok) {
      await res.body?.cancel();
      return c.json({ error: "service not found" }, 404);
    }
    const service: { networkId: number; serviceId: number; name?: string } =
      await res.json();
    const target: CommentTarget = {
      id,
      networkId: service.networkId,
      serviceId: service.serviceId,
      serviceName: service.name,
    };

    const abort = new AbortController();
    const subscriptions = (await Promise.all(
      deps.sources.map(async (source) => ({
        source,
        comments: await source.subscribe(target, { signal: abort.signal }),
      })),
    )).filter((
      subscription,
    ): subscription is {
      source: CommentSource;
      comments: AsyncIterable<SourceComment>;
    } => subscription.comments !== null);

    return streamSSE(c, async (stream) => {
      stream.onAbort(() => abort.abort());

      // 対応ソースの一覧。client は空配列で「実況非対応」と判定して切断する。
      await stream.writeSSE({
        event: "sources",
        data: JSON.stringify(
          subscriptions.map((subscription) => subscription.source.id),
        ),
      });

      const keepAlive = setInterval(() => {
        stream.writeSSE({ event: "ping", data: "" }).catch(() => {
          // 切断済みなら onAbort 側で後始末される。
        });
      }, keepAliveMs);

      try {
        // 各ソースを並行で中継する。ソースは abort まで終わらないため、
        // 実質クライアント切断までこの Promise は解決しない。
        await Promise.all(
          subscriptions.map(async ({ source, comments }) => {
            try {
              for await (const comment of comments) {
                await stream.writeSSE({
                  event: "comment",
                  data: JSON.stringify(comment),
                });
              }
            } catch (e) {
              if (!abort.signal.aborted) {
                console.error(`[comments] source ${source.id} failed:`, e);
              }
            }
          }),
        );
      } finally {
        clearInterval(keepAlive);
        abort.abort();
      }
    });
  });

  return app;
}
