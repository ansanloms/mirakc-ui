import assert from "node:assert/strict";
import { test } from "node:test";
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
    channels: [],
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
    channelId: "27",
    genres: [0, 3],
    ...overrides,
  };
}

test("matchesKeywordRule: 番組名の部分一致 (大文字小文字無視)", () => {
  assert.deepStrictEqual(matchesKeywordRule(rule(), target()), true);
  assert.deepStrictEqual(
    matchesKeywordRule(
      rule({ keyword: "news" }),
      target({ name: "NEWS TODAY" }),
    ),
    true,
  );
  assert.deepStrictEqual(
    matchesKeywordRule(rule({ keyword: "アニメ" }), target()),
    false,
  );
  // 説明文は対象外 (デザイン仕様: 番組名のみ)。name 無しは不一致。
  assert.deepStrictEqual(
    matchesKeywordRule(rule(), target({ name: null })),
    false,
  );
});

test("matchesKeywordRule: 期間は from/to の RFC 3339 日時の範囲で判定する", () => {
  // startAt は 2026-01-02T03:04:05+09:00。
  assert.deepStrictEqual(
    matchesKeywordRule(rule({ from: "2026-01-02T00:00:00+09:00" }), target()),
    true,
  );
  assert.deepStrictEqual(
    matchesKeywordRule(rule({ to: "2026-01-02T23:59:59+09:00" }), target()),
    true,
  );
  assert.deepStrictEqual(
    matchesKeywordRule(rule({ from: "2026-01-03T00:00:00+09:00" }), target()),
    false,
  );
  assert.deepStrictEqual(
    matchesKeywordRule(rule({ to: "2026-01-01T23:59:59+09:00" }), target()),
    false,
  );
  // 同日の範囲 (両端含む)。
  assert.deepStrictEqual(
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
  assert.deepStrictEqual(
    matchesKeywordRule(
      rule({ from: "2026-01-02T00:00:00Z", to: "2026-01-02T23:59:59Z" }),
      target(),
    ),
    false,
  );
});

test("matchesKeywordRule: channels 空は全チャンネル、指定時は一致のみ", () => {
  assert.deepStrictEqual(
    matchesKeywordRule(rule({ channels: ["27"] }), target()),
    true,
  );
  assert.deepStrictEqual(
    matchesKeywordRule(rule({ channels: ["99"] }), target()),
    false,
  );
  assert.deepStrictEqual(
    matchesKeywordRule(
      rule({ channels: ["99"] }),
      target({ channelId: undefined }),
    ),
    false,
  );
});

test("matchesKeywordRule: genres 空は全ジャンル、指定時は lv1 の交差", () => {
  assert.deepStrictEqual(
    matchesKeywordRule(rule({ genres: [0] }), target()),
    true,
  );
  assert.deepStrictEqual(
    matchesKeywordRule(rule({ genres: [7] }), target()),
    false,
  );
  assert.deepStrictEqual(
    matchesKeywordRule(rule({ genres: [0] }), target({ genres: [] })),
    false,
  );
});

test("parseKeywordRuleInput: 正常系は trim と既定値を適用する", () => {
  const result = parseKeywordRuleInput({ keyword: "  サッカー  " });
  assert.deepStrictEqual(result, {
    ok: true,
    input: {
      keyword: "サッカー",
      from: undefined,
      to: undefined,
      channels: [],
      genres: [],
      enabled: true,
    },
  });
});

test("parseKeywordRuleInput: 全項目指定", () => {
  const result = parseKeywordRuleInput({
    keyword: "ドラマ",
    from: "2026-01-01T00:00:00+09:00",
    to: "2026-01-31T23:59:59+09:00",
    channels: ["27", "25"],
    genres: [3, 7],
    enabled: false,
  });
  assert.deepStrictEqual(result.ok, true);
  if (result.ok) {
    assert.deepStrictEqual(result.input.from, "2026-01-01T00:00:00+09:00");
    assert.deepStrictEqual(result.input.to, "2026-01-31T23:59:59+09:00");
    assert.deepStrictEqual(result.input.channels, ["27", "25"]);
    assert.deepStrictEqual(result.input.genres, [3, 7]);
    assert.deepStrictEqual(result.input.enabled, false);
  }
});

test("parseKeywordRuleInput: 不正値は ok:false", () => {
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
    // channels は文字列配列。数値要素は不正。
    { keyword: "x", channels: [1] },
    { keyword: "x", channels: "x" },
    { keyword: "x", genres: [16] },
    { keyword: "x", genres: [-1] },
    { keyword: "x", enabled: "yes" },
  ];
  for (const value of invalid) {
    assert.deepStrictEqual(
      parseKeywordRuleInput(value).ok,
      false,
      JSON.stringify(value),
    );
  }

  const sameDay = parseKeywordRuleInput({
    keyword: "x",
    from: "2026-01-01T00:00:00+09:00",
    to: "2026-01-01T23:59:59+09:00",
  });
  assert.deepStrictEqual(sameDay.ok, true);
});

test("isKeywordRule: 正当な保存値を受け入れる", () => {
  assert.deepStrictEqual(isKeywordRule(rule()), true);
  assert.deepStrictEqual(
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
  assert.deepStrictEqual(
    isKeywordRule({ ...rule(), from: undefined, to: undefined }),
    true,
  );
  // 未知キーがあっても寛容に受け入れる (読み戻しは additionalProperties 緩め)。
  assert.deepStrictEqual(isKeywordRule({ ...rule(), legacyField: 1 }), true);
});

test("isKeywordRule: 壊れた値は除外する", () => {
  const broken: unknown[] = [
    null,
    undefined,
    "rule",
    123,
    {},
    // 必須キー (id / createdAt) 欠落。
    { keyword: "x", channels: [], genres: [], enabled: true },
    // 型違い。
    { ...rule(), createdAt: "x" },
    { ...rule(), enabled: "yes" },
    { ...rule(), channels: "x" },
    // 範囲外ジャンル (minimum / maximum はアサーションとして効く)。
    { ...rule(), genres: [16] },
    { ...rule(), genres: [-1] },
    // format 違反 (@cfworker は format も検証する)。
    { ...rule(), id: "r1" }, // uuid でない
    { ...rule(), from: "2026-01-01" }, // RFC 3339 date-time でない (旧 YYYY-MM-DD)
  ];
  for (const value of broken) {
    assert.deepStrictEqual(isKeywordRule(value), false, JSON.stringify(value));
  }
});
