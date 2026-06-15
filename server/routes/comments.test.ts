import { assertEquals } from "@std/assert";
import { createCommentsRoutes } from "./comments.ts";
import type {
  CommentSource,
  CommentSubscribeOptions,
  CommentTarget,
  SourceComment,
} from "../lib/comments/types.ts";

const SERVICE = {
  id: 3273601024,
  serviceId: 1024,
  networkId: 32736,
  name: "NHK総合・東京",
  channel: { type: "GR", channel: "27" },
};

function mirakcFetchOf(): typeof fetch {
  return ((input: RequestInfo | URL) => {
    const url = String(input);
    if (url === `http://mirakc/api/services/${SERVICE.id}`) {
      return Promise.resolve(Response.json(SERVICE));
    }
    return Promise.resolve(new Response("not found", { status: 404 }));
  }) as typeof fetch;
}

/** 渡したコメントを流して終わるフェイクソース。 */
function fakeSourceOf(
  id: CommentSource["id"],
  comments: SourceComment[],
  supported = true,
): CommentSource & { targets: CommentTarget[] } {
  const targets: CommentTarget[] = [];
  return {
    id,
    targets,
    subscribe(target: CommentTarget, _options: CommentSubscribeOptions) {
      targets.push(target);
      if (!supported) {
        return null;
      }
      return (async function* () {
        for (const comment of comments) {
          yield comment;
        }
      })();
    },
  };
}

Deno.test("comments route: MIRAKC_URL 未設定なら 503", async () => {
  const app = createCommentsRoutes({
    mirakcApiUrl: undefined,
    sources: [],
  });
  const res = await app.request("/services/1/stream");
  assertEquals(res.status, 503);
  await res.body?.cancel();
});

Deno.test("comments route: サービス ID が数値でなければ 400", async () => {
  const app = createCommentsRoutes({
    mirakcApiUrl: "http://mirakc/api",
    sources: [],
    fetchFn: mirakcFetchOf(),
  });
  const res = await app.request("/services/abc/stream");
  assertEquals(res.status, 400);
  await res.body?.cancel();
});

Deno.test("comments route: mirakc にサービスが無ければ 404", async () => {
  const app = createCommentsRoutes({
    mirakcApiUrl: "http://mirakc/api",
    sources: [],
    fetchFn: mirakcFetchOf(),
  });
  const res = await app.request("/services/999/stream");
  assertEquals(res.status, 404);
  await res.body?.cancel();
});

Deno.test("comments route: 有効ソースの一覧とコメントを SSE で流す", async () => {
  const comments: SourceComment[] = [
    { id: "a", source: "nicolive", at: 1718240401_000, text: "one" },
    {
      id: "b",
      source: "nicolive",
      at: 1718240402_000,
      text: "two",
      author: "名前",
    },
  ];
  const nicolive = fakeSourceOf("nicolive", comments);
  const unsupported = fakeSourceOf("nx-jikkyo", [], false);

  const app = createCommentsRoutes({
    mirakcApiUrl: "http://mirakc/api",
    sources: [nicolive, unsupported],
    fetchFn: mirakcFetchOf(),
  });

  const res = await app.request(`/services/${SERVICE.id}/stream`);
  assertEquals(res.status, 200);
  assertEquals(res.headers.get("content-type"), "text/event-stream");

  // フェイクソースは流し終わると終了するため、ストリームは閉じる。
  const body = await res.text();

  // 両ソースに mirakc から解決した id / networkId / serviceId / channel が渡っている。
  assertEquals(nicolive.targets, [{
    id: SERVICE.id,
    networkId: SERVICE.networkId,
    serviceId: SERVICE.serviceId,
    channel: SERVICE.channel.channel,
    serviceName: SERVICE.name,
  }]);
  assertEquals(unsupported.targets.length, 1);

  // 対応ソースの一覧 (subscribe が null でないもの) が最初に流れる。
  assertEquals(body.includes("event: sources"), true);
  assertEquals(body.includes('data: ["nicolive"]'), true);

  // コメントが順に流れる。
  const first = body.indexOf(JSON.stringify(comments[0]));
  const second = body.indexOf(JSON.stringify(comments[1]));
  assertEquals(first >= 0, true);
  assertEquals(second > first, true);
});

Deno.test("comments route: 対応ソースが無ければ空の一覧を流して閉じる", async () => {
  const unsupported = fakeSourceOf("nicolive", [], false);
  const app = createCommentsRoutes({
    mirakcApiUrl: "http://mirakc/api",
    sources: [unsupported],
    fetchFn: mirakcFetchOf(),
  });

  const res = await app.request(`/services/${SERVICE.id}/stream`);
  assertEquals(res.status, 200);
  const body = await res.text();
  assertEquals(body.includes("data: []"), true);
});
