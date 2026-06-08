import type { components } from "../../../lib/api/schema.d.ts";
import * as datetime from "@std/datetime";
import StatusBadge from "../../atoms/StatusBadge.tsx";
import { t } from "../../../locales/i18n.ts";
import styles from "./Item.module.css";

type Props = {
  /** 番組。 */
  program: components["schemas"]["MirakurunProgram"];
  /** 録画予約済か。 */
  reserved?: boolean;
  /** 録画済 (state=finished) か。 */
  recorded?: boolean;
};

/** 番組表グリッドのセル内容。時刻 + LIVE バッジ + タイトル + 予約/録画済フラグ。 */
export default function ProgramItem({ program, reserved, recorded }: Props) {
  const startAt = new Date(program.startAt);
  const now = Date.now();
  const isLive = program.startAt <= now &&
    now < program.startAt + program.duration;

  return (
    <div className={styles.container}>
      {recorded
        ? (
          <span className={`${styles.flag} ${styles.flagRecorded}`}>
            {t("program.badge.recorded")}
          </span>
        )
        : reserved
        ? (
          <span className={styles.flag}>
            <span className={styles.flagDot} />REC
          </span>
        )
        : null}
      <div className={styles.meta}>
        <span className={styles.time}>{datetime.format(startAt, "H:mm")}</span>
        {isLive && <StatusBadge kind="live" />}
      </div>
      <p className={styles.title}>{program.name ?? ""}</p>
    </div>
  );
}
