/**
 * 実況連携設定 (取得元ごとのチャンネル → 実況チャンネル ID の割り当て) の型と
 * 入力検証。server (API・各コメントソースの解決) と client (設定フォームの
 * 検証) が同一ロジックを共有する純粋モジュール (Deno API 依存を持たせない)。
 *
 * 取得元 (source) ごとに ID 形式が違う:
 *   - nicolive  : ニコ生チャンネル ID "ch2646436" (watch URL 末尾)
 *   - nx-jikkyo : 実況チャンネル番号 "jk1"
 */

/** 設定で割り当てを持つ取得元。bsky は将来追加 (現状は受信ソース未実装)。 */
export type LiveCommentSourceId = "nicolive" | "nx-jikkyo";

export const LIVE_COMMENT_SOURCE_IDS: readonly LiveCommentSourceId[] = [
  "nicolive",
  "nx-jikkyo",
];

/** 1 件の割り当て: mirakc のサービス → 取得元のチャンネル ID。 */
export type ChannelMapping = {
  /** mirakc (Mirakurun) の複合サービス ID。 */
  serviceId: number;
  /** 取得元のチャンネル ID (nicolive: "ch…" / nx-jikkyo: "jk…")。 */
  channelId: string;
  /**
   * 有効な割り当てか。無効な行は保存されるが、コメント解決・視聴の候補から
   * 除外され、検証 (形式・重複) の対象外になる (下書きとして残せる)。
   */
  enabled: boolean;
};

/** 取得元ごとの割り当て一覧。 */
export type LiveCommentSettings = Record<LiveCommentSourceId, ChannelMapping[]>;

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

/** 1 取得元の channels 配列を検証する。 */
function parseChannels(
  source: LiveCommentSourceId,
  raw: unknown,
): { ok: true; channels: ChannelMapping[] } | { ok: false; error: string } {
  if (raw === undefined) {
    return { ok: true, channels: [] };
  }
  if (!Array.isArray(raw)) {
    return { ok: false, error: `${source} must be an array` };
  }
  const channels: ChannelMapping[] = [];
  const seenServiceIds = new Set<number>();
  // channelId の重複チェックは有効行同士のみ (無効行は空 ID が並ぶため除外)。
  const seenChannelIds = new Set<string>();
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) {
      return { ok: false, error: `each ${source} channel must be an object` };
    }
    const { serviceId, channelId, enabled: rawEnabled } = entry as Record<
      string,
      unknown
    >;
    if (typeof serviceId !== "number" || !Number.isSafeInteger(serviceId)) {
      return { ok: false, error: `${source}: serviceId must be an integer` };
    }
    if (typeof channelId !== "string") {
      return { ok: false, error: `${source}: channelId must be a string` };
    }
    if (rawEnabled !== undefined && typeof rawEnabled !== "boolean") {
      return { ok: false, error: `${source}: enabled must be a boolean` };
    }
    const enabled = rawEnabled !== false;
    const id = channelId.trim();
    // 形式・ID 重複は有効行のみ検証する。serviceId 重複は有効・無効問わず禁止。
    if (enabled && !isValidChannelId(source, id)) {
      return { ok: false, error: `${source}: invalid channel id: ${id}` };
    }
    if (seenServiceIds.has(serviceId)) {
      return {
        ok: false,
        error: `${source}: duplicate serviceId: ${serviceId}`,
      };
    }
    seenServiceIds.add(serviceId);
    if (enabled) {
      if (seenChannelIds.has(id)) {
        return { ok: false, error: `${source}: duplicate channel id: ${id}` };
      }
      seenChannelIds.add(id);
    }
    channels.push({ serviceId, channelId: id, enabled });
  }
  return { ok: true, channels };
}

/**
 * PUT body の検証。取得元ごとに channels を検証する。取得元が欠けていれば
 * 空配列で補完する。取得元をまたいだ重複は許す (同一サービスを複数取得元に
 * 割り当ててよい)。
 */
export function parseLiveCommentSettingsInput(value: unknown): ParseResult {
  if (typeof value !== "object" || value === null) {
    return { ok: false, error: "body must be an object" };
  }
  const record = value as Record<string, unknown>;
  const input = {} as LiveCommentSettings;
  for (const source of LIVE_COMMENT_SOURCE_IDS) {
    const parsed = parseChannels(source, record[source]);
    if (!parsed.ok) {
      return parsed;
    }
    input[source] = parsed.channels;
  }
  return { ok: true, input };
}

/**
 * KV から読んだ値の正規化。不正値 (旧形状・壊れた値) は null を返し、
 * 未保存と同じ扱い (組み込みの対照表へのフォールバック) にする。
 */
export function normalizeLiveCommentSettings(
  value: unknown,
): LiveCommentSettings | null {
  const parsed = parseLiveCommentSettingsInput(value);
  return parsed.ok ? parsed.input : null;
}
