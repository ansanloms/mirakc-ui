// 時刻の整形・計算は Temporal で行う（Date / @std/datetime には依存しない）。
//
// 番組時刻などの「瞬間」は mirakc API と同じく epoch ミリ秒（number）で受け取り、
// ローカルタイムゾーンの Temporal.ZonedDateTime に変換して整形する。
// 日付ピッカーのように「日（カレンダー日）」を前後させる入出力は、タイムゾーンを
// 保持したまま日単位で扱える Temporal.ZonedDateTime を使う（PlainDate は TZ を
// 落とすため使わない）。

import { locale } from "../locales/i18n.ts";

// タイムゾーンはプロセス実行中に変わらないため一度だけ解決してキャッシュする
// （番組表の大量セル描画など、整形のたびに timeZoneId() を引くコストを避ける）。
const TIME_ZONE = Temporal.Now.timeZoneId();

/**
 * ロケールに応じた曜日の短縮名。曜日名は Intl/CLDR に委ねる（手書きの配列を持たない）。
 * 対応言語が増えても locale を渡すだけで CLDR が解決するため、言語固有の関数を作らない。
 */
function weekdayShortName(z: Temporal.ZonedDateTime): string {
  return z.toLocaleString(locale, { weekday: "short" });
}

/** epoch ms をローカルタイムゾーンの ZonedDateTime にする。 */
export function zonedFromEpochMs(epochMs: number): Temporal.ZonedDateTime {
  return Temporal.Instant.fromEpochMilliseconds(epochMs)
    .toZonedDateTimeISO(TIME_ZONE);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

// ---- ZonedDateTime ベースの整形 core ----
function hm(z: Temporal.ZonedDateTime): string {
  return `${z.hour}:${pad2(z.minute)}`;
}
function md(z: Temporal.ZonedDateTime): string {
  return `${z.month}/${z.day}`;
}
function wdIndex(z: Temporal.ZonedDateTime): number {
  // Temporal の dayOfWeek は 1(月)〜7(日)。% 7 で 日=0..土=6 に直す。
  return z.dayOfWeek % 7;
}

// ---- epoch ms 入力（番組時刻など「瞬間」） ----

/** 現在時刻（epoch ms）。`Date.now()` の Temporal 版。 */
export function nowEpochMs(): number {
  return Temporal.Now.instant().epochMilliseconds;
}

/** "H:mm"（時は 0 詰めなし、分は 2 桁）。 */
export function formatHm(epochMs: number): string {
  return hm(zonedFromEpochMs(epochMs));
}

/** "H"（時のみ）。 */
export function formatH(epochMs: number): string {
  return String(zonedFromEpochMs(epochMs).hour);
}

/** "M/d"。 */
export function formatMd(epochMs: number): string {
  return md(zonedFromEpochMs(epochMs));
}

/** "M/d H:mm"。 */
export function formatMdHm(epochMs: number): string {
  const z = zonedFromEpochMs(epochMs);
  return `${md(z)} ${hm(z)}`;
}

/** "yyyyMMddHHmmss"（録画ファイル名などの連結タイムスタンプ）。 */
export function formatYmdHms(epochMs: number): string {
  const z = zonedFromEpochMs(epochMs);
  return `${z.year}${pad2(z.month)}${pad2(z.day)}${pad2(z.hour)}${
    pad2(z.minute)
  }${pad2(z.second)}`;
}

/** ロケールに応じた曜日の短縮名。 */
export function formatWeekday(epochMs: number): string {
  return weekdayShortName(zonedFromEpochMs(epochMs));
}

/** その時刻が属する「時」の先頭（分以下を 0 にした）epoch ms。 */
export function startOfHourEpochMs(epochMs: number): number {
  return zonedFromEpochMs(epochMs)
    .with({
      minute: 0,
      second: 0,
      millisecond: 0,
      microsecond: 0,
      nanosecond: 0,
    })
    .epochMilliseconds;
}

// ---- ZonedDateTime 入力（日付ピッカー: TZ を保持したまま日単位で扱う） ----

/** 現在時刻のローカル ZonedDateTime。 */
export function nowZoned(): Temporal.ZonedDateTime {
  return Temporal.Now.zonedDateTimeISO();
}

/** ZonedDateTime を "M/d" で整形する。 */
export function formatMdZoned(z: Temporal.ZonedDateTime): string {
  return md(z);
}

/** ZonedDateTime の曜日インデックス（日=0 .. 土=6）。色分け（日=赤/土=青）に使う。 */
export function weekdayIndexZoned(z: Temporal.ZonedDateTime): number {
  return wdIndex(z);
}

/** ZonedDateTime のロケールに応じた曜日の短縮名。 */
export function formatWeekdayZoned(z: Temporal.ZonedDateTime): string {
  return weekdayShortName(z);
}

/** 2 つの ZonedDateTime が（各々の TZ における）同一暦日か。 */
export function isSameZonedDay(
  a: Temporal.ZonedDateTime,
  b: Temporal.ZonedDateTime,
): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}
