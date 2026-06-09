import { useState } from "react";

import IconButton from "../../atoms/IconButton.tsx";
import Icon from "../../atoms/Icon.tsx";
import ColorSchemeToggle from "../../../islands/ColorSchemeToggle.tsx";
import { BANDS } from "../../../lib/service.ts";
import {
  formatMdZoned,
  formatWeekdayZoned,
  isSameZonedDay,
  nowZoned,
  weekdayIndexZoned,
} from "../../../lib/datetime.ts";
import { t } from "../../../locales/i18n.ts";
import styles from "./Toolbar.module.css";

type BandId = "GR" | "BS" | "CS";

type Props = {
  /** 表示対象日（タイムゾーン付き。日単位で扱う）。 */
  targetDate: Temporal.ZonedDateTime;

  /** 日付を切り替える。 */
  onChangeDate: (date: Temporal.ZonedDateTime) => void;

  /** 選択中の band。 */
  band: BandId;

  /** band を切り替える。 */
  onChangeBand: (band: BandId) => void;

  /** 検索モーダルを開く。 */
  onOpenSearch: () => void;

  /** 「今日」の基準時刻。日付ドロップダウンの起点に使う。テスト時に固定できるよう注入可能。 */
  now?: Temporal.ZonedDateTime;
};

/** today（その日の 0:00）起点で count 日分の ZonedDateTime を生成する。 */
function buildDays(
  count: number,
  today: Temporal.ZonedDateTime,
): Temporal.ZonedDateTime[] {
  const out: Temporal.ZonedDateTime[] = [];
  for (let i = 0; i < count; i++) {
    out.push(today.add({ days: i }));
  }
  return out;
}

/** 日曜=赤 / 土曜=青 の曜日色クラス。 */
function dowClassName(date: Temporal.ZonedDateTime): string {
  const day = weekdayIndexZoned(date);
  if (day === 0) {
    return styles.sun;
  }
  if (day === 6) {
    return styles.sat;
  }
  return "";
}

export default function ProgramToolbar(props: Props) {
  const [open, setOpen] = useState(false);
  const today = (props.now ?? nowZoned()).startOfDay();
  const days = buildDays(8, today);
  const last = days[days.length - 1];
  const targetDate = props.targetDate;

  const isToday = isSameZonedDay(targetDate, today);
  const isLast = isSameZonedDay(targetDate, last);

  const shiftDay = (offset: number) => {
    props.onChangeDate(targetDate.startOfDay().add({ days: offset }));
  };

  const pick = (date: Temporal.ZonedDateTime) => {
    props.onChangeDate(date);
    setOpen(false);
  };

  return (
    <header className={styles.toolbar}>
      <div className={styles.dateSwitch}>
        <IconButton
          icon="chevron_left"
          label={t("program.toolbar.prevDay")}
          disabled={isToday}
          onClick={() => shiftDay(-1)}
        />
        <div className={styles.datePick}>
          <button
            type="button"
            className={styles.dateCur}
            onClick={() => setOpen((v) => !v)}
          >
            <span className={dowClassName(targetDate)}>
              {formatMdZoned(targetDate)}
            </span>
            <span className={dowClassName(targetDate)}>
              ({formatWeekdayZoned(targetDate)})
            </span>
            <Icon size={14}>expand_more</Icon>
          </button>
          {open && (
            <div
              className={styles.dateMenu}
              onMouseLeave={() => setOpen(false)}
            >
              {days.map((date) => (
                <button
                  key={date.toString()}
                  type="button"
                  className={`${styles.dateOpt} ${
                    isSameZonedDay(date, targetDate) ? styles.dateOptActive : ""
                  }`}
                  onClick={() => pick(date)}
                >
                  <span>{formatMdZoned(date)}</span>
                  <span className={dowClassName(date)}>
                    ({formatWeekdayZoned(date)})
                  </span>
                  {isSameZonedDay(date, today) && (
                    <span className={styles.optToday}>
                      {t("program.toolbar.today")}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <IconButton
          icon="chevron_right"
          label={t("program.toolbar.nextDay")}
          disabled={isLast}
          onClick={() => shiftDay(1)}
        />
      </div>

      <div className={styles.bandTabs}>
        {BANDS.map((b) => (
          <button
            key={b.id}
            type="button"
            className={`${styles.bandTab} ${
              props.band === b.id ? styles.bandTabActive : ""
            }`}
            onClick={() => props.onChangeBand(b.id)}
          >
            {b.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        className={styles.searchTrigger}
        onClick={props.onOpenSearch}
      >
        <Icon size={16}>search</Icon>
        <span className={styles.stText}>{t("program.toolbar.search")}</span>
        <kbd className={styles.stKbd}>⌘K</kbd>
      </button>

      <div className={styles.right}>
        <ColorSchemeToggle />
      </div>
    </header>
  );
}
