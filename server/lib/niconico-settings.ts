/**
 * ニコニコ実況連携設定 (チャンネル → ニコニコチャンネル ID の割り当て) の型と
 * 入力検証。server (API・nicolive ソースの解決) と client (設定フォームの
 * 検証) が同一ロジックを共有する純粋モジュール (Deno API 依存を持たせない)。
 */

/** 1 件の割り当て: mirakc のサービス → ニコニコチャンネル ID。 */
export type NiconicoChannelMapping = {
  /** mirakc (Mirakurun) の複合サービス ID。 */
  serviceId: number;
  /** ニコニコチャンネル ID (例: "ch2646436")。 */
  nicoliveChannelId: string;
};

export type NiconicoSettings = {
  channels: NiconicoChannelMapping[];
};

/** https://live.nicovideo.jp/watch/{ch} の ch 形式。 */
const NICOLIVE_CHANNEL_ID_PATTERN = /^ch\d+$/;

export function isValidNicoliveChannelId(value: string): boolean {
  return NICOLIVE_CHANNEL_ID_PATTERN.test(value);
}

export type ParseResult =
  | { ok: true; input: NiconicoSettings }
  | { ok: false; error: string };

/**
 * PUT body の検証。serviceId は整数、ニコニコチャンネル ID は ch 数字形式で、
 * どちらも重複を許さない。空の割り当て (channels: []) は有効。
 */
export function parseNiconicoSettingsInput(value: unknown): ParseResult {
  if (typeof value !== "object" || value === null) {
    return { ok: false, error: "body must be an object" };
  }
  const channels = (value as Record<string, unknown>).channels;
  if (!Array.isArray(channels)) {
    return { ok: false, error: "channels must be an array" };
  }

  const parsed: NiconicoChannelMapping[] = [];
  const seenServiceIds = new Set<number>();
  const seenChannelIds = new Set<string>();
  for (const entry of channels) {
    if (typeof entry !== "object" || entry === null) {
      return { ok: false, error: "each channel must be an object" };
    }
    const { serviceId, nicoliveChannelId } = entry as Record<string, unknown>;
    if (typeof serviceId !== "number" || !Number.isSafeInteger(serviceId)) {
      return { ok: false, error: "serviceId must be an integer" };
    }
    if (typeof nicoliveChannelId !== "string") {
      return { ok: false, error: "nicoliveChannelId must be a string" };
    }
    const channelId = nicoliveChannelId.trim();
    if (!isValidNicoliveChannelId(channelId)) {
      return {
        ok: false,
        error: `invalid nicolive channel id: ${channelId}`,
      };
    }
    if (seenServiceIds.has(serviceId)) {
      return { ok: false, error: `duplicate serviceId: ${serviceId}` };
    }
    if (seenChannelIds.has(channelId)) {
      return {
        ok: false,
        error: `duplicate nicolive channel id: ${channelId}`,
      };
    }
    seenServiceIds.add(serviceId);
    seenChannelIds.add(channelId);
    parsed.push({ serviceId, nicoliveChannelId: channelId });
  }
  return { ok: true, input: { channels: parsed } };
}

/**
 * KV から読んだ値の正規化。不正値 (旧形状・壊れた値) は null を返し、
 * 未保存と同じ扱い (組み込みの対照表へのフォールバック) にする。
 */
export function normalizeNiconicoSettings(
  value: unknown,
): NiconicoSettings | null {
  const parsed = parseNiconicoSettingsInput(value);
  return parsed.ok ? parsed.input : null;
}
