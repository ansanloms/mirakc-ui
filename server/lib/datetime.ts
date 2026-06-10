/**
 * server 側の日時整形ユーティリティ。client/lib/datetime.ts と同様に
 * Temporal を使う (Deno はフラグ無しで Temporal を提供する)。
 * テストで固定できるよう timeZone を引数で受け取る。
 */

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function zoned(
  epochMs: number,
  timeZone: string,
): Temporal.ZonedDateTime {
  return Temporal.Instant.fromEpochMilliseconds(epochMs)
    .toZonedDateTimeISO(timeZone);
}

/**
 * 録画ファイル名用の YYYYMMDDhhmmss。client の formatYmdHms
 * (client/lib/datetime.ts) と同じ表現にし、手動予約とファイル名形式を揃える。
 */
export function formatYmdHms(
  epochMs: number,
  timeZone: string = Temporal.Now.timeZoneId(),
): string {
  const z = zoned(epochMs, timeZone);
  return `${z.year}${pad2(z.month)}${pad2(z.day)}${pad2(z.hour)}${
    pad2(z.minute)
  }${pad2(z.second)}`;
}

/** 通知文面用の人間可読な日時 (YYYY/MM/DD hh:mm)。 */
export function formatDisplayDateTime(
  epochMs: number,
  timeZone: string = Temporal.Now.timeZoneId(),
): string {
  const z = zoned(epochMs, timeZone);
  return `${z.year}/${pad2(z.month)}/${pad2(z.day)} ${pad2(z.hour)}:${
    pad2(z.minute)
  }`;
}
