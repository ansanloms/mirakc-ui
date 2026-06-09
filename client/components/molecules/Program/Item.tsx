import { useMemo } from "react";

import type { components } from "../../../lib/api/schema.d.ts";
import { formatHm } from "../../../lib/datetime.ts";
import { extractProgramMarks } from "../../../lib/program-status.ts";
import ProgramMarks from "../../atoms/ProgramMarks.tsx";
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

/** 番組表グリッドのセル内容。時刻 + ステータス記号 + タイトル + 予約/録画済フラグ。 */
export default function ProgramItem({ program, reserved, recorded }: Props) {
  // program.name からステータス記号 ([字] 等) を抽出し、表示名から除去する。
  const { name, marks } = useMemo(
    () => extractProgramMarks(program.name),
    [program.name],
  );

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
        <span className={styles.time}>{formatHm(program.startAt)}</span>
        <ProgramMarks marks={marks} variant="grid" max={4} />
      </div>
      <p className={styles.title}>{name}</p>
    </div>
  );
}
