import { useState } from "react";
import * as datetime from "@std/datetime";

import IconButton from "../../atoms/IconButton.tsx";
import Icon from "../../atoms/Icon.tsx";
import ColorSchemeToggle from "../../../islands/ColorSchemeToggle.tsx";
import { BANDS } from "../../../lib/service.ts";
import { t } from "../../../locales/i18n.ts";
import styles from "./Toolbar.module.css";

type BandId = "GR" | "BS" | "CS";

type Props = {
  /** 表示対象日。 */
  targetDate: Date;

  /** 日付を切り替える。 */
  onChangeDate: (date: Date) => void;

  /** 選択中の band。 */
  band: BandId;

  /** band を切り替える。 */
  onChangeBand: (band: BandId) => void;

  /** 検索モーダルを開く。 */
  onOpenSearch: () => void;
};

const WEEKDAY = ["日", "月", "火", "水", "木", "金", "土"];

/** 年月日が一致するか。 */
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

/** 今日 0:00 起点で n 日分の Date を生成する。 */
function buildDates(count: number): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const out: Date[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    out.push(d);
  }
  return out;
}

/** 日曜=赤 / 土曜=青 の曜日色クラス。 */
function dowClassName(date: Date): string {
  const day = date.getDay();
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
  const dates = buildDates(8);
  const today = dates[0];
  const last = dates[dates.length - 1];

  const isToday = isSameDay(props.targetDate, today);
  const isLast = isSameDay(props.targetDate, last);

  const shiftDay = (offset: number) => {
    const next = new Date(props.targetDate);
    next.setHours(0, 0, 0, 0);
    next.setDate(next.getDate() + offset);
    props.onChangeDate(next);
  };

  const pick = (date: Date) => {
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
            <span className={dowClassName(props.targetDate)}>
              {datetime.format(props.targetDate, "M/d")}
            </span>
            <span className={dowClassName(props.targetDate)}>
              ({WEEKDAY[props.targetDate.getDay()]})
            </span>
            <Icon size={14}>expand_more</Icon>
          </button>
          {open && (
            <div
              className={styles.dateMenu}
              onMouseLeave={() => setOpen(false)}
            >
              {dates.map((date) => (
                <button
                  key={date.getTime()}
                  type="button"
                  className={`${styles.dateOpt} ${
                    isSameDay(date, props.targetDate)
                      ? styles.dateOptActive
                      : ""
                  }`}
                  onClick={() => pick(date)}
                >
                  <span>{datetime.format(date, "M/d")}</span>
                  <span className={dowClassName(date)}>
                    ({WEEKDAY[date.getDay()]})
                  </span>
                  {isSameDay(date, today) && (
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
