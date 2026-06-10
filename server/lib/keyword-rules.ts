/**
 * キーワード自動録画ルールの型・バリデーション・一致判定。
 *
 * Deno API に依存しない純粋モジュールで、server (録画ジョブ・API) と
 * client (一致プレビュー・件数表示) の両方から runtime import される
 * (server/lib/quality.ts と同じ共有パターン)。永続化は
 * keyword-rules-store.ts (Deno KV) が担う。
 */

/** キーワード自動録画のルール。 */
export type KeywordRule = {
  /** ルールの識別子 (UUID)。 */
  id: string;

  /** 番組名に対して部分一致させるキーワード (大文字小文字無視)。 */
  keyword: string;

  /** 期間の開始日 (ローカル日付 YYYY-MM-DD、両端含む)。未指定は無制限。 */
  from?: string;

  /** 期間の終了日 (ローカル日付 YYYY-MM-DD、両端含む)。未指定は無制限。 */
  to?: string;

  /** 対象サービス (Mirakurun service id)。空配列は全チャンネル。 */
  serviceIds: number[];

  /** 対象ジャンル (ARIB lv1 コード 0..15)。空配列は全ジャンル。 */
  genres: number[];

  /** 有効/停止。停止中は自動予約しない。 */
  enabled: boolean;

  /** 登録日時 (epoch ms)。 */
  createdAt: number;
};

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

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type ParseResult =
  | { ok: true; input: KeywordRuleInput }
  | { ok: false; error: string };

/**
 * API 入力をバリデーションして正規化する。keyword は trim、enabled は
 * 既定 true。期間は YYYY-MM-DD で開始 <= 終了 (同日可)。
 */
export function parseKeywordRuleInput(value: unknown): ParseResult {
  if (typeof value !== "object" || value === null) {
    return { ok: false, error: "body must be an object" };
  }
  const body = value as Record<string, unknown>;

  if (typeof body.keyword !== "string" || body.keyword.trim() === "") {
    return { ok: false, error: "keyword must be a non-empty string" };
  }
  const keyword = body.keyword.trim();

  for (const key of ["from", "to"] as const) {
    const date = body[key];
    if (date !== undefined && date !== "" && date !== null) {
      if (typeof date !== "string" || !DATE_PATTERN.test(date)) {
        return { ok: false, error: `${key} must be a YYYY-MM-DD date` };
      }
    }
  }
  const from = typeof body.from === "string" && body.from !== ""
    ? body.from
    : undefined;
  const to = typeof body.to === "string" && body.to !== ""
    ? body.to
    : undefined;
  if (from !== undefined && to !== undefined && from > to) {
    return { ok: false, error: "from must not be after to" };
  }

  const serviceIds = body.serviceIds ?? [];
  if (
    !Array.isArray(serviceIds) ||
    serviceIds.some((id) => typeof id !== "number" || !Number.isFinite(id))
  ) {
    return { ok: false, error: "serviceIds must be an array of numbers" };
  }

  const genres = body.genres ?? [];
  if (
    !Array.isArray(genres) ||
    genres.some(
      (lv1) =>
        typeof lv1 !== "number" || !Number.isInteger(lv1) ||
        lv1 < 0 || lv1 > 15,
    )
  ) {
    return {
      ok: false,
      error: "genres must be an array of ARIB lv1 codes (0..15)",
    };
  }

  if (body.enabled !== undefined && typeof body.enabled !== "boolean") {
    return { ok: false, error: "enabled must be a boolean" };
  }

  return {
    ok: true,
    input: {
      keyword,
      from,
      to,
      serviceIds: serviceIds as number[],
      genres: genres as number[],
      enabled: body.enabled === undefined ? true : body.enabled,
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
