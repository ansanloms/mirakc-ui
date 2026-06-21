// 時刻の整形・計算は Temporal で行う（Date / @std/datetime には依存しない）。
//
// 番組時刻などの「瞬間」は mirakc API と同じく epoch ミリ秒（number）で受け取り、
// ローカルタイムゾーンの Temporal.ZonedDateTime に変換して整形する。
// 日付ピッカーのように「日（カレンダー日）」を前後させる入出力は、タイムゾーンを
// 保持したまま日単位で扱える Temporal.ZonedDateTime を使う（PlainDate は TZ を
// 落とすため使わない）。

import { locale } from "../locales/i18n.ts";

// 日時表示に使うタイムゾーン。既定はブラウザのローカル TZ だが、アプリ起動時に
// サーバ設定（/api/config）で上書きし、全ての日時表示をサーバ側（TZ 環境変数）に
// 揃える（setTimeZone）。番組表の大量セル描画などで整形のたびに timeZoneId() を
// 引くコストを避けるため、定数ではなくモジュール変数に保持する。
let timeZone = Temporal.Now.timeZoneId();

/**
 * 日時表示に使うタイムゾーンを設定する。アプリ起動時にサーバ設定（/api/config の
 * timeZone）で上書きするための入口。描画の前に 1 度だけ呼ぶ想定。
 */
export function setTimeZone(tz: string): void {
  timeZone = tz;
}

/** 現在の日時表示タイムゾーン（IANA タイムゾーン ID）。 */
export function getTimeZone(): string {
  return timeZone;
}

/**
 * ロケールに応じた曜日の短縮名。曜日名は Intl/CLDR に委ねる（手書きの配列を持たない）。
 * 対応言語が増えても locale を渡すだけで CLDR が解決するため、言語固有の関数を作らない。
 */
function weekdayShortName(z: Temporal.ZonedDateTime): string {
  return z.toLocaleString(locale, { weekday: "short" });
}

/** epoch ms を表示タイムゾーンの ZonedDateTime にする。 */
export function zonedFromEpochMs(epochMs: number): Temporal.ZonedDateTime {
  return Temporal.Instant.fromEpochMilliseconds(epochMs)
    .toZonedDateTimeISO(timeZone);
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

/** 現在時刻の、表示タイムゾーンでの ZonedDateTime。 */
export function nowZoned(): Temporal.ZonedDateTime {
  return Temporal.Now.zonedDateTimeISO(timeZone);
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

// ---- 日付文字列 (YYYY-MM-DD) ⇔ RFC 3339 日時 (タイムゾーン付き) ----
//
// キーワード録画ルールの期間 from / to は API 上はタイムゾーン付きの RFC 3339
// 日時だが、UI では時刻を持たせず日付ピッカーで扱う。送信時に from は当日の
// 00:00:00、to は当日の 23:59:59 を表示タイムゾーンのオフセット付きで補う。

function localDateTimeString(
  date: string,
  hour: number,
  minute: number,
  second: number,
): string {
  const [year, month, day] = date.split("-").map(Number);
  return Temporal.ZonedDateTime.from({
    year,
    month,
    day,
    hour,
    minute,
    second,
    timeZone,
  }).toString({ timeZoneName: "never" });
}

/** 日付 (YYYY-MM-DD) を、その日のローカル開始時刻 00:00:00 の RFC 3339 文字列にする。 */
export function localStartOfDay(date: string): string {
  return localDateTimeString(date, 0, 0, 0);
}

/** 日付 (YYYY-MM-DD) を、その日のローカル終了時刻 23:59:59 の RFC 3339 文字列にする。 */
export function localEndOfDay(date: string): string {
  return localDateTimeString(date, 23, 59, 59);
}

/** RFC 3339 日時から日付部分 (YYYY-MM-DD) を取り出す。空・未指定は空文字。 */
export function dateOf(datetime: string | undefined | null): string {
  return datetime ? datetime.slice(0, 10) : "";
}
