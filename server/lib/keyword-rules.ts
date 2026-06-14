/**
 * キーワード自動録画ルールの型・バリデーション・一致判定。
 *
 * Deno API に依存しない純粋モジュールで、server (録画ジョブ・API) と
 * client (一致プレビュー・件数表示) の両方から runtime import される
 * (server/lib/quality.ts と同じ共有パターン)。永続化は
 * server/store/keyword-rules.ts (Deno KV) が担う。
 */
import type { FromSchema } from "json-schema-to-ts";
import { internalSchemas } from "./api/internal-schemas.ts";
import { matchesSchema, schemaErrorOf } from "./api/validate.ts";

/**
 * キーワード自動録画のルール。docs/api の OpenAPI から生成した component
 * schema (internal-schemas.ts) を型の単一ソースとする。
 * (id / keyword / serviceIds / genres / enabled / createdAt を持ち、
 * from / to は任意。)
 */
export type KeywordRule = FromSchema<typeof internalSchemas["KeywordRule"]>;

/** ルールの登録・更新入力 (id / createdAt を除く)。 */
export type KeywordRuleInput = Omit<KeywordRule, "id" | "createdAt">;

/** 一致判定の対象となる番組情報 (MirakurunProgram のサブセット)。 */
export type KeywordRuleTarget = {
  name?: string | null;

  /** 開始時刻 (epoch ms)。期間条件のローカル日付判定に使う。 */
  startAt: number;

  /** Mirakurun service id (networkId とのペアから解決した複合 id)。 */
  serviceId?: number;

  /** ジャンルの ARIB lv1 コード一覧。 */
  genres: number[];
};

/** KV から読んだ値のバリデーション用の型ガード。 */
export function isKeywordRule(value: unknown): value is KeywordRule {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const rule = value as Record<string, unknown>;
  return typeof rule.id === "string" &&
    typeof rule.keyword === "string" &&
    (rule.from === undefined || typeof rule.from === "string") &&
    (rule.to === undefined || typeof rule.to === "string") &&
    Array.isArray(rule.serviceIds) &&
    Array.isArray(rule.genres) &&
    typeof rule.enabled === "boolean" &&
    typeof rule.createdAt === "number";
}

/** RFC 3339 日時文字列を Temporal.Instant にする。不正なら null (オフセット必須)。 */
function toInstant(value: string): Temporal.Instant | null {
  try {
    return Temporal.Instant.from(value);
  } catch {
    return null;
  }
}

export type ParseResult =
  | { ok: true; input: KeywordRuleInput }
  | { ok: false; error: string };

/**
 * リクエストボディが KeywordRuleInput スキーマ (required 緩和済み) に適合するか
 * を判定する型ガード。適合すれば serviceIds / genres / enabled / from / to は
 * 任意 (未指定は parse 側で既定値補完) の型に narrow される。
 */
function isKeywordRuleInputBody(
  value: unknown,
): value is FromSchema<typeof internalSchemas["KeywordRuleInput"]> {
  return matchesSchema("KeywordRuleInput", value);
}

/**
 * API 入力を docs/api の OpenAPI スキーマ (internal-schemas.ts) で構造検証し、
 * 正規化する。型・必須・配列要素・数値範囲はスキーマ検証が担う。keyword の
 * trim と空チェック、from/to の RFC 3339 検証と `from <= to`、既定値の補完は
 * OpenAPI に表現できないためここで行う。
 */
export function parseKeywordRuleInput(value: unknown): ParseResult {
  if (!isKeywordRuleInputBody(value)) {
    return { ok: false, error: schemaErrorOf("KeywordRuleInput", value) };
  }

  const keyword = value.keyword.trim();
  if (keyword === "") {
    return { ok: false, error: "keyword must be a non-empty string" };
  }

  for (const key of ["from", "to"] as const) {
    const dt = value[key];
    if (dt !== undefined && dt !== "" && toInstant(dt) === null) {
      return { ok: false, error: `${key} must be an RFC 3339 date-time` };
    }
  }
  const from = value.from !== undefined && value.from !== ""
    ? value.from
    : undefined;
  const to = value.to !== undefined && value.to !== "" ? value.to : undefined;
  if (from !== undefined && to !== undefined) {
    const fromInstant = toInstant(from);
    const toInstantValue = toInstant(to);
    if (
      fromInstant !== null && toInstantValue !== null &&
      Temporal.Instant.compare(fromInstant, toInstantValue) > 0
    ) {
      return { ok: false, error: "from must not be after to" };
    }
  }

  return {
    ok: true,
    input: {
      keyword,
      from,
      to,
      serviceIds: value.serviceIds ?? [],
      genres: value.genres ?? [],
      enabled: value.enabled ?? true,
    },
  };
}

/**
 * 番組がルールに一致するか。enabled は見ない (編集モーダルのプレビューが
 * 下書きルールで使うため)。有効ルールだけに適用するのは呼び出し側の責務。
 *
 * - キーワード: 番組名の部分一致 (大文字小文字無視)。名前なしは不一致
 * - 期間: 開始時刻 (瞬間) が from / to の RFC 3339 日時の範囲内 (両端含む)。
 *   from / to はタイムゾーン付きの絶対時刻なので瞬間どうしで比較する
 * - serviceIds / genres: 空は無条件、指定時は一致 (genres は交差) を要求
 */
export function matchesKeywordRule(
  rule: Pick<KeywordRule, "keyword" | "from" | "to" | "serviceIds" | "genres">,
  target: KeywordRuleTarget,
): boolean {
  if (!target.name?.toLowerCase().includes(rule.keyword.toLowerCase())) {
    return false;
  }

  if (rule.from !== undefined) {
    const from = toInstant(rule.from);
    if (from !== null && target.startAt < from.epochMilliseconds) {
      return false;
    }
  }
  if (rule.to !== undefined) {
    const to = toInstant(rule.to);
    if (to !== null && target.startAt > to.epochMilliseconds) {
      return false;
    }
  }

  if (rule.serviceIds.length > 0) {
    if (
      target.serviceId === undefined ||
      !rule.serviceIds.includes(target.serviceId)
    ) {
      return false;
    }
  }

  if (rule.genres.length > 0) {
    if (!target.genres.some((lv1) => rule.genres.includes(lv1))) {
      return false;
    }
  }

  return true;
}
