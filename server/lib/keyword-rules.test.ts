import { assertEquals } from "@std/assert";
import {
  type KeywordRule,
  matchesKeywordRule,
  parseKeywordRuleInput,
} from "./keyword-rules.ts";

function rule(overrides: Partial<KeywordRule> = {}): KeywordRule {
  return {
    id: "r1",
    keyword: "ニュース",
    serviceIds: [],
    genres: [],
    enabled: true,
    createdAt: 0,
    ...overrides,
  };
}

// 2026-01-02T03:04:05+09:00 (= 2026-01-01T18:04:05Z)
const startAt = Date.UTC(2026, 0, 1, 18, 4, 5);

function target(overrides: Record<string, unknown> = {}) {
  return {
    name: "ニュースウォッチ",
    startAt,
    serviceId: 3273601024,
    genres: [0, 3],
    ...overrides,
  };
}

Deno.test("matchesKeywordRule: 番組名の部分一致 (大文字小文字無視)", () => {
  assertEquals(matchesKeywordRule(rule(), target()), true);
  assertEquals(
    matchesKeywordRule(
      rule({ keyword: "news" }),
      target({ name: "NEWS TODAY" }),
    ),
    true,
  );
  assertEquals(
    matchesKeywordRule(rule({ keyword: "アニメ" }), target()),
    false,
  );
  // 説明文は対象外 (デザイン仕様: 番組名のみ)。name 無しは不一致。
  assertEquals(matchesKeywordRule(rule(), target({ name: null })), false);
});

Deno.test("matchesKeywordRule: 期間は from/to の RFC 3339 日時の範囲で判定する", () => {
  // startAt は 2026-01-02T03:04:05+09:00。
  assertEquals(
    matchesKeywordRule(rule({ from: "2026-01-02T00:00:00+09:00" }), target()),
    true,
  );
  assertEquals(
    matchesKeywordRule(rule({ to: "2026-01-02T23:59:59+09:00" }), target()),
    true,
  );
  assertEquals(
    matchesKeywordRule(rule({ from: "2026-01-03T00:00:00+09:00" }), target()),
    false,
  );
  assertEquals(
    matchesKeywordRule(rule({ to: "2026-01-01T23:59:59+09:00" }), target()),
    false,
  );
  // 同日の範囲 (両端含む)。
  assertEquals(
    matchesKeywordRule(
      rule({
        from: "2026-01-02T00:00:00+09:00",
        to: "2026-01-02T23:59:59+09:00",
      }),
      target(),
    ),
    true,
  );
  // オフセット違いで範囲が変わる: UTC の 2026-01-02 では startAt (前日 18:04Z) は範囲外。
  assertEquals(
    matchesKeywordRule(
      rule({ from: "2026-01-02T00:00:00Z", to: "2026-01-02T23:59:59Z" }),
      target(),
    ),
    false,
  );
});

Deno.test("matchesKeywordRule: serviceIds 空は全チャンネル、指定時は一致のみ", () => {
  assertEquals(
    matchesKeywordRule(rule({ serviceIds: [3273601024] }), target()),
    true,
  );
  assertEquals(
    matchesKeywordRule(rule({ serviceIds: [999] }), target()),
    false,
  );
  assertEquals(
    matchesKeywordRule(
      rule({ serviceIds: [999] }),
      target({ serviceId: undefined }),
    ),
    false,
  );
});

Deno.test("matchesKeywordRule: genres 空は全ジャンル、指定時は lv1 の交差", () => {
  assertEquals(matchesKeywordRule(rule({ genres: [0] }), target()), true);
  assertEquals(matchesKeywordRule(rule({ genres: [7] }), target()), false);
  assertEquals(
    matchesKeywordRule(rule({ genres: [0] }), target({ genres: [] })),
    false,
  );
});

Deno.test("parseKeywordRuleInput: 正常系は trim と既定値を適用する", () => {
  const result = parseKeywordRuleInput({ keyword: "  サッカー  " });
  assertEquals(result, {
    ok: true,
    input: {
      keyword: "サッカー",
      from: undefined,
      to: undefined,
      serviceIds: [],
      genres: [],
      enabled: true,
    },
  });
});

Deno.test("parseKeywordRuleInput: 全項目指定", () => {
  const result = parseKeywordRuleInput({
    keyword: "ドラマ",
    from: "2026-01-01T00:00:00+09:00",
    to: "2026-01-31T23:59:59+09:00",
    serviceIds: [3273601024, 3273701032],
    genres: [3, 7],
    enabled: false,
  });
  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.input.from, "2026-01-01T00:00:00+09:00");
    assertEquals(result.input.to, "2026-01-31T23:59:59+09:00");
    assertEquals(result.input.serviceIds, [3273601024, 3273701032]);
    assertEquals(result.input.genres, [3, 7]);
    assertEquals(result.input.enabled, false);
  }
});

Deno.test("parseKeywordRuleInput: 不正値は ok:false", () => {
  const invalid: unknown[] = [
    null,
    {},
    { keyword: "" },
    { keyword: "   " },
    { keyword: 1 },
    { keyword: "x", from: "2026/01/01" },
    { keyword: "x", to: "abc" },
    // オフセット無し (RFC 3339 でない) は不正。
    { keyword: "x", from: "2026-01-01" },
    // 開始 > 終了 (同日は許容)。
    {
      keyword: "x",
      from: "2026-01-02T00:00:00+09:00",
      to: "2026-01-01T23:59:59+09:00",
    },
    { keyword: "x", serviceIds: ["a"] },
    { keyword: "x", genres: [16] },
    { keyword: "x", genres: [-1] },
    { keyword: "x", enabled: "yes" },
  ];
  for (const value of invalid) {
    assertEquals(parseKeywordRuleInput(value).ok, false, JSON.stringify(value));
  }

  const sameDay = parseKeywordRuleInput({
    keyword: "x",
    from: "2026-01-01T00:00:00+09:00",
    to: "2026-01-01T23:59:59+09:00",
  });
  assertEquals(sameDay.ok, true);
});
