/**
 * 実況連携設定 (取得元ごとのチャンネル → 実況チャンネル ID の割り当て) の型と
 * 入力検証。Deno API に依存しない純粋モジュールで、server (API・各コメント
 * ソースの解決) と client (設定フォームの検証) の両方から runtime import される
 * (server/lib/notification-settings.ts と同じ共有パターン)。永続化は
 * server/store/live-comment-settings.ts (Deno KV) が担う。
 *
 * 型は docs/api の OpenAPI から生成した component schema (internal-schemas.ts)
 * を単一ソースとする。構造 (型・必須・配列要素) は @cfworker/json-schema の
 * 検証が担い、OpenAPI に表現できない相関チェック (チャンネル ID の形式・重複)
 * はこのモジュールの parse 関数に残す。
 *
 * 取得元 (source) ごとに ID 形式が違う:
 *   - nicolive  : ニコ生チャンネル ID "ch2646436" (watch URL 末尾)
 *   - nx-jikkyo : 実況チャンネル番号 "jk1"
 */
import type { FromSchema } from "json-schema-to-ts";
import { internalSchemas } from "./api/internal-schemas.ts";
import { matchesSchema, schemaErrorOf } from "./api/validate.ts";

/** 設定で割り当てを持つ取得元 (表示順)。bsky は受信ソース未実装のため対象外。 */
export const LIVE_COMMENT_SOURCE_IDS = [
  "nicolive",
  "nx-jikkyo",
] as const;

export type LiveCommentSourceId = (typeof LIVE_COMMENT_SOURCE_IDS)[number];

/**
 * 1 件の割り当て: mirakc のサービス → 取得元のチャンネル ID。
 * serviceId は複合サービス ID、channelId は取得元固有の ID (ch… / jk…)、
 * enabled が false の行は下書きとして保存されるが解決・検証の対象外。
 */
export type ChannelMapping = FromSchema<typeof internalSchemas["ChannelMapping"]>;

/** 取得元ごとの割り当て一覧 (= `Record<LiveCommentSourceId, ChannelMapping[]>`)。 */
export type LiveCommentSettings = FromSchema<
  typeof internalSchemas["LiveCommentSettings"]
>;

/** GET / の応答。client の設定フォームが使う。 */
export type LiveCommentSettingsView = FromSchema<
  typeof internalSchemas["LiveCommentSettingsView"]
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

export type ParseResult =
  | { ok: true; input: LiveCommentSettings }
  | { ok: false; error: string };

/**
 * 構造検証を通すための前処理。欠けた取得元キーは空配列で補完し、各行の
 * enabled は未指定なら true を補う (#39 互換の「enabled 既定 true」挙動)。
 */
function withDefaults(value: unknown): unknown {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return value;
  }
  const record = value as Record<string, unknown>;
  const filled: Record<string, unknown> = { ...record };
  for (const source of LIVE_COMMENT_SOURCE_IDS) {
    const raw = record[source];
    if (raw === undefined) {
      filled[source] = [];
      continue;
    }
    if (!Array.isArray(raw)) {
      continue; // 構造検証側でエラーにする。
    }
    filled[source] = raw.map((entry) => {
      if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
        return entry;
      }
      const e = entry as Record<string, unknown>;
      return e.enabled === undefined ? { ...e, enabled: true } : e;
    });
  }
  return filled;
}

/**
 * 1 取得元の channels を検証・正規化する。channelId は trim する。
 * serviceId の重複は有効・無効問わず禁止、channelId の形式・重複は有効行のみ
 * 検証する (無効行は空 ID が並ぶため形式・重複の対象外)。
 */
function validateChannels(
  source: LiveCommentSourceId,
  channels: ChannelMapping[],
): { ok: true; channels: ChannelMapping[] } | { ok: false; error: string } {
  const result: ChannelMapping[] = [];
  const seenServiceIds = new Set<number>();
  const seenChannelIds = new Set<string>();
  for (const { serviceId, channelId, enabled } of channels) {
    const id = channelId.trim();
    if (enabled && !isValidChannelId(source, id)) {
      return { ok: false, error: `${source}: invalid channel id: ${id}` };
    }
    if (seenServiceIds.has(serviceId)) {
      return { ok: false, error: `${source}: duplicate serviceId: ${serviceId}` };
    }
    seenServiceIds.add(serviceId);
    if (enabled) {
      if (seenChannelIds.has(id)) {
        return { ok: false, error: `${source}: duplicate channel id: ${id}` };
      }
      seenChannelIds.add(id);
    }
    result.push({ serviceId, channelId: id, enabled });
  }
  return { ok: true, channels: result };
}

/** value が LiveCommentSettings スキーマに構造適合するかを判定する型ガード。 */
function isLiveCommentSettings(value: unknown): value is LiveCommentSettings {
  return matchesSchema("LiveCommentSettings", value);
}

/**
 * PUT body の検証。取得元が欠けていれば空配列で補完し、各行の enabled は
 * 既定 true。構造を schema で検証してから、取得元ごとにチャンネル ID の形式・
 * 重複を検証する。取得元をまたいだ重複は許す (同一サービスを複数取得元に
 * 割り当ててよい)。
 */
export function parseLiveCommentSettingsInput(value: unknown): ParseResult {
  const candidate = withDefaults(value);
  if (!isLiveCommentSettings(candidate)) {
    return { ok: false, error: schemaErrorOf("LiveCommentSettings", candidate) };
  }
  const input = {} as LiveCommentSettings;
  for (const source of LIVE_COMMENT_SOURCE_IDS) {
    const parsed = validateChannels(source, candidate[source]);
    if (!parsed.ok) {
      return parsed;
    }
    input[source] = parsed.channels;
  }
  return { ok: true, input };
}

/**
 * KV から読んだ値の正規化。不正値 (旧形状・壊れた値) は null を返し、未保存と
 * 同じ扱い (組み込みの対照表へのフォールバック) にする。読み戻しは入力検証を
 * 流用する (保存時に検証済みのため、構造が合えばそのまま通る)。
 */
export function normalizeLiveCommentSettings(
  value: unknown,
): LiveCommentSettings | null {
  const parsed = parseLiveCommentSettingsInput(value);
  return parsed.ok ? parsed.input : null;
}
