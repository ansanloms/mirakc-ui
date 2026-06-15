/**
 * 実況連携設定 (チャンネル → 取得元の実況チャンネル ID 割り当て) の型と検証。
 * Deno API に依存しない純粋モジュールで、server (API・各コメントソースの解決) と
 * client (設定フォームの検証・候補表示) の両方から runtime import される
 * (server/lib/keyword-rules.ts と同じ共有パターン)。永続化は
 * server/store/live-comment-settings.ts (Deno KV) が担う。
 *
 * 型は docs/api の OpenAPI から生成した component schema (internal-schemas.ts)
 * を単一ソースとする。構造 (型・必須・配列要素・enum) は @cfworker/json-schema
 * の検証が担い、OpenAPI に表現できない相関チェック (channel の非空、取得元ごとの
 * チャンネル ID 形式、エントリ内の割り当て重複) はこのモジュールの parse 関数に
 * 残す。チャンネル単位の重複 (同一 channel を複数エントリに登録できない) は全件を
 * 要するため route 側の責務とする。
 *
 * 取得元 (source) ごとに ID 形式が違う:
 *   - nicolive  : ニコ生チャンネル ID "ch2646436" (watch URL 末尾)
 *   - nx-jikkyo : 実況チャンネル番号 "jk1"
 */
import type { FromSchema } from "json-schema-to-ts";
import { internalSchemas } from "./api/internal-schemas.ts";
import {
  matchesSchema,
  matchesStoredSchema,
  schemaErrorOf,
} from "./api/validate.ts";

/** 設定で割り当てを持つ取得元 (表示順)。bsky は受信ソース未実装のため対象外。 */
export const LIVE_COMMENT_SOURCE_IDS = [
  "nicolive",
  "nx-jikkyo",
] as const;

export type LiveCommentSourceId = (typeof LIVE_COMMENT_SOURCE_IDS)[number];

/** 1 件の割り当て: 取得元 + その取得元での実況チャンネル ID。 */
export type LiveCommentAssignment = FromSchema<
  typeof internalSchemas["LiveCommentAssignment"]
>;

/** 1 チャンネル分の割り当て (id / createdAt を含む保存形)。 */
export type LiveCommentMapping = FromSchema<
  typeof internalSchemas["LiveCommentMapping"]
>;

/** 割り当ての登録・更新入力 (id / createdAt を除く)。 */
export type LiveCommentMappingInput = FromSchema<
  typeof internalSchemas["LiveCommentMappingInput"]
>;

/** フォームの自動補完候補 (組み込み対照表から導出)。 */
export type LiveCommentSuggestion = FromSchema<
  typeof internalSchemas["LiveCommentSuggestion"]
>;

/** 取得元ごとのチャンネル ID 形式。 */
const ID_PATTERN: Record<LiveCommentSourceId, RegExp> = {
  "nicolive": /^ch\d+$/,
  "nx-jikkyo": /^jk\d+$/,
};

export function isValidChannelId(
  source: LiveCommentSourceId,
  value: string,
): boolean {
  return ID_PATTERN[source].test(value);
}

/**
 * KV から読み戻した値が LiveCommentMapping か。型の単一ソースである生成スキーマ
 * (internal-schemas.ts) で検証する。@cfworker は format も検証するため id の uuid も
 * ここで担保される。読み戻しは寛容で、未知キーを許し undefined 値のキーを均す
 * (詳細は matchesStoredSchema)。channel の非空・ID 形式・重複は入力側
 * (parseLiveCommentMappingInput) の責務で、ここでは見ない。
 */
export function isLiveCommentMapping(
  value: unknown,
): value is LiveCommentMapping {
  return matchesStoredSchema("LiveCommentMapping", value);
}

export type ParseResult =
  | { ok: true; input: LiveCommentMappingInput }
  | { ok: false; error: string };

/**
 * リクエストボディが LiveCommentMappingInput スキーマ (required 緩和済み) に
 * 適合するかを判定する型ガード。適合すれば assignments / enabled は任意
 * (未指定は parse 側で既定値補完) の型に narrow される。
 */
function isLiveCommentMappingInputBody(
  value: unknown,
): value is FromSchema<typeof internalSchemas["LiveCommentMappingInput"]> {
  return matchesSchema("LiveCommentMappingInput", value);
}

/**
 * API 入力を docs/api の OpenAPI スキーマ (internal-schemas.ts) で構造検証し、
 * 正規化する。型・必須・配列要素・enum はスキーマ検証が担う。channel の trim と
 * 空チェック、各割り当ての ID 形式 (取得元ごと)、エントリ内の (取得元, ID) 重複、
 * 既定値の補完は OpenAPI に表現できないためここで行う。割り当ては enabled に
 * 関わらず ID 形式を検証する (停止中のエントリも有効な ID を持つ)。
 */
export function parseLiveCommentMappingInput(value: unknown): ParseResult {
  if (!isLiveCommentMappingInputBody(value)) {
    return {
      ok: false,
      error: schemaErrorOf("LiveCommentMappingInput", value),
    };
  }

  const channel = value.channel.trim();
  if (channel === "") {
    return { ok: false, error: "channel must be a non-empty string" };
  }

  const assignments: LiveCommentAssignment[] = [];
  const seen = new Set<string>();
  for (const { source, channelId } of value.assignments ?? []) {
    const id = channelId.trim();
    if (!isValidChannelId(source, id)) {
      return { ok: false, error: `invalid channel id for ${source}: ${id}` };
    }
    const key = `${source}:${id}`;
    if (seen.has(key)) {
      return { ok: false, error: `duplicate assignment for ${source}: ${id}` };
    }
    seen.add(key);
    assignments.push({ source, channelId: id });
  }

  return {
    ok: true,
    input: { channel, assignments, enabled: value.enabled ?? true },
  };
}
