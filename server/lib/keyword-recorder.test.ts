import { assertEquals } from "@std/assert";
import {
  buildContentPath,
  KEYWORD_RECORDING_TAG,
  runKeywordRecording,
} from "./keyword-recorder.ts";
import type { KeywordRule } from "./keyword-rules.ts";

// 2026-01-02T03:04:05+09:00
const startAt = Date.UTC(2026, 0, 1, 18, 4, 5);

const services = [
  { id: 3273601024, networkId: 32736, serviceId: 1024, name: "テレビA" },
  { id: 3273701032, networkId: 32737, serviceId: 1032, name: "テレビB" },
];

function program(overrides: Record<string, unknown> = {}) {
  return {
    id: 327360102706471,
    name: "ニュースウォッチ",
    description: "今日の出来事",
    startAt,
    duration: 30 * 60 * 1000,
    networkId: 32736,
    serviceId: 1024,
    genres: [{ lv1: 0, lv2: 0, un1: 0, un2: 0 }],
    ...overrides,
  };
}

function rule(overrides: Partial<KeywordRule> = {}): KeywordRule {
  return {
    id: "rule-1",
    keyword: "ニュース",
    serviceIds: [],
    genres: [],
    enabled: true,
    createdAt: 0,
    ...overrides,
  };
}

Deno.test("buildContentPath: 開始日時_番組ID_番組名.m2ts", () => {
  assertEquals(
    buildContentPath(program(), "Asia/Tokyo"),
    "20260102030405_327360102706471_ニュースウォッチ.m2ts",
  );
});

type FetchCall = { url: string; method: string; body?: unknown };

function fakeMirakc(options: {
  programs: unknown[];
  schedules?: unknown[];
  failPostFor?: number[];
}) {
  const calls: FetchCall[] = [];
  const fetchFn = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    const call: FetchCall = { url, method };
    if (init?.body) {
      call.body = JSON.parse(String(init.body));
    }
    calls.push(call);

    if (url.endsWith("/programs") && method === "GET") {
      return Promise.resolve(Response.json(options.programs));
    }
    if (url.endsWith("/services") && method === "GET") {
      return Promise.resolve(Response.json(services));
    }
    if (url.endsWith("/recording/schedules") && method === "GET") {
      return Promise.resolve(Response.json(options.schedules ?? []));
    }
    if (url.endsWith("/recording/schedules") && method === "POST") {
      const body = call.body as { programId: number };
      if (options.failPostFor?.includes(body.programId)) {
        return Promise.resolve(new Response("ng", { status: 500 }));
      }
      return Promise.resolve(new Response("created", { status: 201 }));
    }
    return Promise.resolve(new Response("not found", { status: 404 }));
  }) as typeof fetch;
  return { calls, fetchFn };
}

function deps(
  rules: KeywordRule[],
  fetchFn: typeof fetch,
  notifications: { title: string; message: string }[] = [],
) {
  return {
    mirakcApiUrl: "http://mirakc:40772/api",
    listRules: () => Promise.resolve(rules),
    notify: (n: { title: string; message: string }) => {
      notifications.push({ title: n.title, message: n.message });
      return Promise.resolve(true);
    },
    fetchFn,
    now: startAt - 60_000,
    timeZone: "Asia/Tokyo",
  };
}

Deno.test("runKeywordRecording: 有効ルールが無ければ何もしない", async () => {
  const { calls, fetchFn } = fakeMirakc({ programs: [program()] });
  const result = await runKeywordRecording(
    deps([rule({ enabled: false })], fetchFn),
  );
  assertEquals(result.registered, []);
  assertEquals(calls, []);
});

Deno.test("runKeywordRecording: 一致した将来番組を予約し通知する", async () => {
  const target = program();
  const { calls, fetchFn } = fakeMirakc({
    programs: [target, program({ id: 2, name: "アニメまつり" })],
  });
  const notifications: { title: string; message: string }[] = [];

  const result = await runKeywordRecording(
    deps([rule()], fetchFn, notifications),
  );

  assertEquals(result.registered, [
    { programId: target.id, keyword: "ニュース" },
  ]);

  const post = calls.find((c) => c.method === "POST");
  assertEquals(post?.url, "http://mirakc:40772/api/recording/schedules");
  assertEquals(post?.body, {
    programId: target.id,
    options: {
      contentPath: "20260102030405_327360102706471_ニュースウォッチ.m2ts",
    },
    tags: [KEYWORD_RECORDING_TAG, "keyword:ニュース"],
  });

  assertEquals(notifications.length, 1);
  assertEquals(notifications[0].title, "録画登録: ニュースウォッチ");
  // キーワード + チャンネル名 + 放送時間 (開始 03:04:05 + 30 分 → 03:34)。
  assertEquals(
    notifications[0].message,
    "キーワード「ニュース」に一致する番組を予約しました。\n" +
      "テレビA\n2026/01/02 03:04 〜 03:34",
  );
});

Deno.test("runKeywordRecording: チャンネル条件は service id を解決して判定する", async () => {
  // 番組は networkId 32736 / serviceId 1024 → Mirakurun id 3273601024。
  const { calls, fetchFn } = fakeMirakc({ programs: [program()] });

  const matched = await runKeywordRecording(
    deps([rule({ serviceIds: [3273601024] })], fetchFn),
  );
  assertEquals(matched.registered.length, 1);

  const { fetchFn: fetchFn2 } = fakeMirakc({ programs: [program()] });
  const unmatched = await runKeywordRecording(
    deps([rule({ serviceIds: [3273701032] })], fetchFn2),
  );
  assertEquals(unmatched.registered, []);
  assertEquals(calls.filter((c) => c.method === "POST").length, 1);
});

Deno.test("runKeywordRecording: ジャンル・期間の条件も適用される", async () => {
  const { fetchFn } = fakeMirakc({ programs: [program()] });
  const result = await runKeywordRecording(
    deps([rule({ genres: [7] })], fetchFn),
  );
  assertEquals(result.registered, []);

  const { fetchFn: fetchFn2 } = fakeMirakc({ programs: [program()] });
  // startAt は Asia/Tokyo で 2026-01-02。
  const inPeriod = await runKeywordRecording(
    deps([rule({ from: "2026-01-02", to: "2026-01-02" })], fetchFn2),
  );
  assertEquals(inPeriod.registered.length, 1);
});

Deno.test("runKeywordRecording: 予約済み・過去の番組はスキップする", async () => {
  const past = program({ id: 1, startAt: startAt - 86_400_000 });
  const scheduled = program({ id: 2 });
  const fresh = program({ id: 3 });
  const { calls, fetchFn } = fakeMirakc({
    programs: [past, scheduled, fresh],
    schedules: [{ program: { id: 2 }, state: "scheduled", tags: [] }],
  });

  const result = await runKeywordRecording(deps([rule()], fetchFn));

  assertEquals(result.registered, [{ programId: 3, keyword: "ニュース" }]);
  assertEquals(calls.filter((c) => c.method === "POST").length, 1);
});

Deno.test("runKeywordRecording: 複数ルール一致でも 1 番組 1 予約", async () => {
  const { calls, fetchFn } = fakeMirakc({ programs: [program()] });

  const result = await runKeywordRecording(
    deps([rule(), rule({ id: "rule-2", keyword: "ウォッチ" })], fetchFn),
  );

  assertEquals(result.registered.length, 1);
  assertEquals(calls.filter((c) => c.method === "POST").length, 1);
});

Deno.test("runKeywordRecording: 予約 POST が失敗しても他の番組を続行する", async () => {
  const a = program({ id: 1 });
  const b = program({ id: 2 });
  const { fetchFn } = fakeMirakc({ programs: [a, b], failPostFor: [1] });
  const notifications: { title: string; message: string }[] = [];

  const result = await runKeywordRecording(
    deps([rule()], fetchFn, notifications),
  );

  assertEquals(result.registered, [{ programId: 2, keyword: "ニュース" }]);
  assertEquals(notifications.length, 1);
});
