import { assertEquals } from "@std/assert";
import { createLiveCommentSettingsRoutes } from "./live-comment-settings.ts";
import type {
  LiveCommentMapping,
  LiveCommentMappingInput,
} from "../lib/live-comment-settings.ts";

function fakeStore(initial: LiveCommentMapping[] = []) {
  const mappings = [...initial];
  let seq = mappings.length;
  return {
    mappings,
    list: () => Promise.resolve([...mappings]),
    add: (input: LiveCommentMappingInput, now: number = 0) => {
      const mapping: LiveCommentMapping = {
        ...input,
        assignments: input.assignments ?? [],
        enabled: input.enabled ?? true,
        id: `id-${seq++}`,
        createdAt: now,
      };
      mappings.push(mapping);
      return Promise.resolve(mapping);
    },
    update: (id: string, input: LiveCommentMappingInput) => {
      const index = mappings.findIndex((m) => m.id === id);
      if (index < 0) {
        return Promise.resolve(null);
      }
      mappings[index] = {
        ...input,
        assignments: input.assignments ?? [],
        enabled: input.enabled ?? true,
        id,
        createdAt: mappings[index].createdAt,
      };
      return Promise.resolve(mappings[index]);
    },
    remove: (id: string) => {
      const index = mappings.findIndex((m) => m.id === id);
      if (index < 0) {
        return Promise.resolve(false);
      }
      mappings.splice(index, 1);
      return Promise.resolve(true);
    },
  };
}

function mappingOf(
  overrides: Partial<LiveCommentMapping> = {},
): LiveCommentMapping {
  return {
    id: "a",
    channel: "27",
    assignments: [{ source: "nx-jikkyo", channelId: "jk1" }],
    enabled: true,
    createdAt: 1,
    ...overrides,
  };
}

Deno.test("GET /: 割り当て一覧を返す", async () => {
  const mapping = mappingOf();
  const app = createLiveCommentSettingsRoutes(fakeStore([mapping]));
  const res = await app.request("/");
  assertEquals(res.status, 200);
  assertEquals(await res.json(), [mapping]);
});

Deno.test("POST /: 割り当てを追加して 201、trim と既定値補完", async () => {
  const store = fakeStore();
  const app = createLiveCommentSettingsRoutes(store);
  const res = await app.request("/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      channel: " 27 ",
      assignments: [{ source: "nx-jikkyo", channelId: " jk1 " }],
    }),
  });
  assertEquals(res.status, 201);
  const body = await res.json();
  assertEquals(body.channel, "27");
  assertEquals(body.assignments, [{ source: "nx-jikkyo", channelId: "jk1" }]);
  assertEquals(body.enabled, true);
  assertEquals(store.mappings.length, 1);
});

Deno.test("POST /: 不正な入力は 400", async () => {
  const app = createLiveCommentSettingsRoutes(fakeStore());
  const bodies = [
    {},
    { channel: "" },
    { channel: "27", assignments: [{ source: "nicolive", channelId: "jk1" }] },
    { channel: "27", assignments: [{ source: "unknown", channelId: "ch1" }] },
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

Deno.test("POST /: 同一チャンネルでも重複登録できる (一意制約なし)", async () => {
  const store = fakeStore([mappingOf({ channel: "27" })]);
  const app = createLiveCommentSettingsRoutes(store);
  const res = await app.request("/", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      channel: "27",
      assignments: [{ source: "nicolive", channelId: "ch1" }],
    }),
  });
  assertEquals(res.status, 201);
  await res.body?.cancel();
  assertEquals(store.mappings.length, 2);
});

Deno.test("PUT /:id: 更新で 200、無ければ 404、不正は 400", async () => {
  const store = fakeStore([mappingOf()]);
  const app = createLiveCommentSettingsRoutes(store);

  const res = await app.request("/a", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ channel: "27", assignments: [], enabled: false }),
  });
  assertEquals(res.status, 200);
  const body = await res.json();
  assertEquals(body.id, "a");
  assertEquals(body.enabled, false);
  assertEquals(body.createdAt, 1);

  const missing = await app.request("/missing", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ channel: "27" }),
  });
  assertEquals(missing.status, 404);
  await missing.body?.cancel();

  const invalid = await app.request("/a", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ channel: "" }),
  });
  assertEquals(invalid.status, 400);
  await invalid.body?.cancel();
});

Deno.test("DELETE /:id: 削除で 204、無ければ 404", async () => {
  const app = createLiveCommentSettingsRoutes(fakeStore([mappingOf()]));
  const deleted = await app.request("/a", { method: "DELETE" });
  assertEquals(deleted.status, 204);
  const missing = await app.request("/a", { method: "DELETE" });
  assertEquals(missing.status, 404);
  await missing.body?.cancel();
});
