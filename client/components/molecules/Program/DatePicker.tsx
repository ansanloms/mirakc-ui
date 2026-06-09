import { useState } from "react";

import IconButton from "../../atoms/IconButton.tsx";
import Icon from "../../atoms/Icon.tsx";
import {
  formatMdZoned,
  formatWeekdayZoned,
  isSameZonedDay,
  nowZoned,
  weekdayIndexZoned,
} from "../../../lib/datetime.ts";
import { t } from "../../../locales/i18n.ts";
import styles from "./DatePicker.module.css";

type Props = {
  /** 表示対象日（タイムゾーン付き。日単位で扱う）。 */
  targetDate: Temporal.ZonedDateTime;

  /** 日付を切り替える。 */
  onChangeDate: (date: Temporal.ZonedDateTime) => void;

  /** 「今日」の基準時刻。ドロップダウンの起点に使う。テスト時に固定できるよう注入可能。 */
  now?: Temporal.ZonedDateTime;

  /** ドロップダウンに並べる日数（今日からの日数）。 */
  dayCount?: number;
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

/**
 * 番組表ツールバーの日付ナビゲーション。前日/翌日ボタンと、今日起点の
 * ドロップダウンで表示対象日を切り替える。開閉状態は自身で持つ。
 */
export default function ProgramDatePicker(props: Props) {
  const [open, setOpen] = useState(false);
  const today = (props.now ?? nowZoned()).startOfDay();
  const days = buildDays(props.dayCount ?? 8, today);
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
  );
}
