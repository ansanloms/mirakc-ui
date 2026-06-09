import { describe, expect, it } from "vitest";
import {
  formatH,
  formatHm,
  formatMd,
  formatMdHm,
  formatMdZoned,
  formatWeekday,
  formatWeekdayZoned,
  formatYmdHms,
  isSameZonedDay,
  nowEpochMs,
  nowZoned,
  startOfHourEpochMs,
  weekdayIndexZoned,
  zonedFromEpochMs,
} from "./datetime.ts";
import { locale } from "../locales/i18n.ts";

const HOUR = 60 * 60 * 1000;
// 任意の固定 epoch ms。曜日名はシステム TZ・ロケールに依存するため、
// ハードコードせず Intl の結果と突き合わせて検証する。
const ms = 1736900000000;
const tz = Temporal.Now.timeZoneId();
const zoned = Temporal.Instant.fromEpochMilliseconds(ms).toZonedDateTimeISO(tz);

describe("datetime (epoch ms 入力)", () => {
  it("formatHm は H:mm（時 0 詰めなし・分 2 桁）", () => {
    expect(formatHm(ms)).toMatch(/^\d{1,2}:\d{2}$/);
  });

  it("formatH は時のみ", () => {
    expect(formatH(ms)).toMatch(/^\d{1,2}$/);
  });

  it("formatMd は M/d", () => {
    expect(formatMd(ms)).toMatch(/^\d{1,2}\/\d{1,2}$/);
  });

  it("formatMdHm は M/d H:mm", () => {
    expect(formatMdHm(ms)).toMatch(/^\d{1,2}\/\d{1,2} \d{1,2}:\d{2}$/);
  });

  it("formatWeekday はロケールの曜日短縮名（Intl と一致）", () => {
    expect(formatWeekday(ms)).toBe(
      zoned.toLocaleString(locale, { weekday: "short" }),
    );
  });

  it("nowEpochMs は正の数を返す", () => {
    expect(nowEpochMs()).toBeGreaterThan(0);
  });

  it("startOfHourEpochMs は同じ時の先頭（分以下 0）に丸める", () => {
    const h = startOfHourEpochMs(ms);
    expect(h).toBeLessThanOrEqual(ms);
    expect(ms - h).toBeLessThan(HOUR);
    expect(formatHm(h)).toMatch(/:00$/);
  });
});

describe("datetime (ZonedDateTime 入力)", () => {
  it("nowZoned は ZonedDateTime を返す", () => {
    expect(nowZoned()).toBeInstanceOf(Temporal.ZonedDateTime);
  });

  it("formatMdZoned は M/d", () => {
    const z = Temporal.ZonedDateTime.from(`2026-03-09T12:00:00[${tz}]`);
    expect(formatMdZoned(z)).toBe("3/9");
  });

  it("weekdayIndexZoned は 日=0..土=6（dayOfWeek=7 の日曜が 0）", () => {
    const sunday = Temporal.ZonedDateTime.from(`2026-03-08T00:00:00[${tz}]`);
    const monday = Temporal.ZonedDateTime.from(`2026-03-09T00:00:00[${tz}]`);
    expect(weekdayIndexZoned(sunday)).toBe(0);
    expect(weekdayIndexZoned(monday)).toBe(1);
  });

  it("formatWeekdayZoned はロケールの曜日短縮名（Intl と一致）", () => {
    const z = Temporal.ZonedDateTime.from(`2026-03-09T00:00:00[${tz}]`);
    expect(formatWeekdayZoned(z)).toBe(
      z.toLocaleString(locale, { weekday: "short" }),
    );
  });

  it("isSameZonedDay は同一暦日で true、別日で false", () => {
    const a = Temporal.ZonedDateTime.from(`2026-03-09T01:00:00[${tz}]`);
    const b = Temporal.ZonedDateTime.from(`2026-03-09T23:00:00[${tz}]`);
    const c = Temporal.ZonedDateTime.from(`2026-03-10T00:00:00[${tz}]`);
    expect(isSameZonedDay(a, b)).toBe(true);
    expect(isSameZonedDay(a, c)).toBe(false);
  });
});

describe("datetime (epoch ms ⇄ ZonedDateTime)", () => {
  it("zonedFromEpochMs は同じ瞬間の ZonedDateTime を返す", () => {
    const z = zonedFromEpochMs(ms);
    expect(z).toBeInstanceOf(Temporal.ZonedDateTime);
    expect(z.epochMilliseconds).toBe(ms);
  });

  it("formatYmdHms は yyyyMMddHHmmss（14 桁、先頭は年）", () => {
    const out = formatYmdHms(ms);
    expect(out).toMatch(/^\d{14}$/);
    expect(out.startsWith(String(zoned.year))).toBe(true);
  });
});
