/**
 * キーワード自動録画ルールの型・バリデーション・一致判定。
 *
 * Deno API に依存しない純粋モジュールで、server (録画ジョブ・API) と
 * client (一致プレビュー・件数表示) の両方から runtime import される
 * (server/lib/quality.ts と同じ共有パターン)。永続化は
 * server/store/keyword-rules.ts (Deno KV) が担う。
 *
 * 型・構造検証の単一ソースは JSON Schema (keywordRuleSchema)。静的型は
 * json-schema-to-ts の FromSchema で導出し、実行時検証は @cfworker/json-schema
 * で行う。バリデータは遅延構築する — client は matchesKeywordRule だけを
 * runtime import するため、最上位でバリデータを構築すると @cfworker が client
 * バンドルに混入する。遅延構築なら未使用時に tree-shake で除去される。
 */

import type { FromSchema } from "json-schema-to-ts";
import { Validator } from "@cfworker/json-schema";

const DATE_PATTERN = "^\\d{4}-\\d{2}-\\d{2}$";

/**
 * キーワード自動録画ルールの JSON Schema (型・構造検証の単一ソース)。
 * 型・範囲・日付書式はここに集約する。フィールド間の条件 (from <= to) は
 * JSON Schema で表現できないため parseKeywordRuleInput で別途検証する。
 */
export const keywordRuleSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string", description: "ルールの識別子 (UUID)" },
    keyword: {
      type: "string",
      minLength: 1,
      description: "番組名に対して部分一致させるキーワード (大文字小文字無視)",
    },
    from: {
      type: "string",
      pattern: DATE_PATTERN,
      description:
        "期間の開始日 (ローカル日付 YYYY-MM-DD、両端含む)。未指定は無制限",
    },
    to: {
      type: "string",
      pattern: DATE_PATTERN,
      description:
        "期間の終了日 (ローカル日付 YYYY-MM-DD、両端含む)。未指定は無制限",
    },
    serviceIds: {
      type: "array",
      items: { type: "integer" },
      description: "対象サービス (Mirakurun service id)。空配列は全チャンネル",
    },
    genres: {
      type: "array",
      items: { type: "integer", minimum: 0, maximum: 15 },
      description: "対象ジャンル (ARIB lv1 コード 0..15)。空配列は全ジャンル",
    },
    enabled: {
      type: "boolean",
      description: "有効/停止。停止中は自動予約しない",
    },
    createdAt: { type: "number", description: "登録日時 (epoch ms)" },
  },
  required: ["id", "keyword", "serviceIds", "genres", "enabled", "createdAt"],
} as const;

/** キーワード自動録画のルール (keywordRuleSchema から導出)。 */
export type KeywordRule = FromSchema<typeof keywordRuleSchema>;

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

// バリデータは遅延構築 + memo 化する (上記の tree-shake 上の理由)。
// readonly な as const スキーマは Validator のコンストラクタ型と合わないため
// キャストする (実行時は問題ない)。
type ValidatorSchema = ConstructorParameters<typeof Validator>[0];

// 読み戻し検証は additionalProperties を緩める (型は厳格な as const から
// 取り、実行時は寛容に — 既存データの未知キーで正当なルールを drop しない)。
let fullValidatorInstance: Validator | null = null;
function fullValidator(): Validator {
  if (fullValidatorInstance === null) {
    const readSchema = { ...keywordRuleSchema, additionalProperties: true };
    fullValidatorInstance = new Validator(
      readSchema as unknown as ValidatorSchema,
      "7",
    );
  }
  return fullValidatorInstance;
}

// 入力検証用スキーマは full から id / createdAt を除いて runtime 生成する
// (入力の静的型は KeywordRuleInput = Omit<...> が担うため as const 不要)。
let inputValidatorInstance: Validator | null = null;
function inputValidator(): Validator {
  if (inputValidatorInstance === null) {
    const { id: _id, createdAt: _createdAt, ...properties } =
      keywordRuleSchema.properties;
    const inputSchema = {
      type: "object",
      additionalProperties: false,
      properties,
      required: keywordRuleSchema.required.filter(
        (key) => key !== "id" && key !== "createdAt",
      ),
    };
    inputValidatorInstance = new Validator(
      inputSchema as unknown as ValidatorSchema,
      "7",
    );
  }
  return inputValidatorInstance;
}

/**
 * undefined 値のキーを除く。Deno KV / V8 直列化は undefined を保持し、
 * @cfworker のバリデータは undefined 値で例外を投げるため、検証前に均す。
 */
function withoutUndefined(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, v] of Object.entries(value)) {
    if (v !== undefined) {
      result[key] = v;
    }
  }
  return result;
}

/** KV から読んだ値が KeywordRule か (keywordRuleSchema で検証)。 */
export function isKeywordRule(value: unknown): value is KeywordRule {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  try {
    return fullValidator().validate(
      withoutUndefined(value as Record<string, unknown>),
    ).valid;
  } catch {
    return false;
  }
}

export type ParseResult =
  | { ok: true; input: KeywordRuleInput }
  | { ok: false; error: string };

/**
 * API 入力をバリデーションして正規化する。keyword は trim、enabled は
 * 既定 true、serviceIds / genres は既定 []、空の from / to は undefined。
 * 構造は keywordRuleSchema (id / createdAt を除く) で検証し、期間の前後
 * (from <= to、同日可) のみ別途検証する。
 */
export function parseKeywordRuleInput(value: unknown): ParseResult {
  if (typeof value !== "object" || value === null) {
    return { ok: false, error: "body must be an object" };
  }
  const body = value as Record<string, unknown>;

  const keyword = typeof body.keyword === "string"
    ? body.keyword.trim()
    : body.keyword;
  const from = typeof body.from === "string" && body.from !== ""
    ? body.from
    : undefined;
  const to = typeof body.to === "string" && body.to !== ""
    ? body.to
    : undefined;
  const serviceIds = body.serviceIds ?? [];
  const genres = body.genres ?? [];
  const enabled = body.enabled === undefined ? true : body.enabled;

  // 検証用オブジェクトは undefined キーを持たせない (@cfworker 対策)。
  const candidate = withoutUndefined({
    keyword,
    from,
    to,
    serviceIds,
    genres,
    enabled,
  });

  const result = inputValidator().validate(candidate);
  if (!result.valid) {
    const first = result.errors[0];
    return {
      ok: false,
      error: first
        ? `${first.instanceLocation || "/"} ${first.error}`
        : "invalid input",
    };
  }

  if (from !== undefined && to !== undefined && from > to) {
    return { ok: false, error: "from must not be after to" };
  }

  return {
    ok: true,
    input: {
      keyword: keyword as string,
      from,
      to,
      serviceIds: serviceIds as number[],
      genres: genres as number[],
      enabled: enabled as boolean,
    },
  };
}

/** epoch ms をタイムゾーン付きのローカル日付 (YYYY-MM-DD) にする。 */
export function localDateOf(
  epochMs: number,
  timeZone: string = Temporal.Now.timeZoneId(),
): string {
  const z = Temporal.Instant.fromEpochMilliseconds(epochMs)
    .toZonedDateTimeISO(timeZone);
  return `${z.year}-${String(z.month).padStart(2, "0")}-${
    String(z.day).padStart(2, "0")
  }`;
}

/**
 * 番組がルールに一致するか。enabled は見ない (編集モーダルのプレビューが
 * 下書きルールで使うため)。有効ルールだけに適用するのは呼び出し側の責務。
 *
 * - キーワード: 番組名の部分一致 (大文字小文字無視)。名前なしは不一致
 * - 期間: 開始時刻のローカル日付が [from, to] 内 (両端含む)
 * - serviceIds / genres: 空は無条件、指定時は一致 (genres は交差) を要求
 */
export function matchesKeywordRule(
  rule: Pick<KeywordRule, "keyword" | "from" | "to" | "serviceIds" | "genres">,
  target: KeywordRuleTarget,
  timeZone?: string,
): boolean {
  if (!target.name?.toLowerCase().includes(rule.keyword.toLowerCase())) {
    return false;
  }

  if (rule.from !== undefined || rule.to !== undefined) {
    const date = localDateOf(target.startAt, timeZone);
    if (rule.from !== undefined && date < rule.from) {
      return false;
    }
    if (rule.to !== undefined && date > rule.to) {
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
