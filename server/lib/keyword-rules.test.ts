import { assertEquals } from "@std/assert";
import {
  isKeywordRule,
  type KeywordRule,
  matchesKeywordRule,
  parseKeywordRuleInput,
} from "./keyword-rules.ts";

function rule(overrides: Partial<KeywordRule> = {}): KeywordRule {
  return {
    // id は uuid (生成スキーマの format: uuid を満たす実データ相当)。
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
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

Deno.test("isKeywordRule: 正当な保存値を受け入れる", () => {
  assertEquals(isKeywordRule(rule()), true);
  assertEquals(
    isKeywordRule(
      rule({
        from: "2026-01-01T00:00:00+09:00",
        to: "2026-01-31T23:59:59+09:00",
      }),
    ),
    true,
  );
  // 期間未指定は from / to が undefined キーで保存される (KV / V8 直列化は
  // undefined を保持する)。検証前に均すため drop されないこと。
  assertEquals(
    isKeywordRule({ ...rule(), from: undefined, to: undefined }),
    true,
  );
  // 未知キーがあっても寛容に受け入れる (読み戻しは additionalProperties 緩め)。
  assertEquals(isKeywordRule({ ...rule(), legacyField: 1 }), true);
});

Deno.test("isKeywordRule: 壊れた値は除外する", () => {
  const broken: unknown[] = [
    null,
    undefined,
    "rule",
    123,
    {},
    // 必須キー (id / createdAt) 欠落。
    { keyword: "x", serviceIds: [], genres: [], enabled: true },
    // 型違い。
    { ...rule(), createdAt: "x" },
    { ...rule(), enabled: "yes" },
    { ...rule(), serviceIds: "x" },
    // 範囲外ジャンル (minimum / maximum はアサーションとして効く)。
    { ...rule(), genres: [16] },
    { ...rule(), genres: [-1] },
    // format 違反 (@cfworker は format も検証する)。
    { ...rule(), id: "r1" }, // uuid でない
    { ...rule(), from: "2026-01-01" }, // RFC 3339 date-time でない (旧 YYYY-MM-DD)
  ];
  for (const value of broken) {
    assertEquals(isKeywordRule(value), false, JSON.stringify(value));
  }
});
