import { useMemo } from "react";

import type { components } from "../../../lib/api/schema.d.ts";
import { formatHm } from "../../../lib/datetime.ts";
import { extractProgramMarks } from "../../../lib/program-status.ts";
import ProgramMarks from "../../atoms/ProgramMarks.tsx";
import RecordingStatusBadge from "../../atoms/RecordingStatusBadge.tsx";
import styles from "./Item.module.css";

type RecordingScheduleState = components["schemas"]["RecordingScheduleState"];

type Props = {
  /** 番組。 */
  program: components["schemas"]["MirakurunProgram"];
  /** 録画スケジュールの状態 (予約/録画中/失敗/録画済)。無ければバッジを出さない。 */
  state?: RecordingScheduleState;
};

/** 番組表グリッドのセル内容。時刻 + ステータス記号 + タイトル + 録画ステータスバッジ。 */
export default function ProgramItem({ program, state }: Props) {
  // program.name からステータス記号 ([字] 等) を抽出し、表示名から除去する。
  const { name, marks } = useMemo(
    () => extractProgramMarks(program.name),
    [program.name],
  );

  return (
    <div className={styles.container}>
      {state && (
        <span className={styles.flagSlot}>
          <RecordingStatusBadge state={state} />
        </span>
      )}
      <div className={styles.meta}>
        <span className={styles.time}>{formatHm(program.startAt)}</span>
        <ProgramMarks marks={marks} variant="grid" max={4} />
      </div>
      <p className={styles.title}>{name}</p>
    </div>
  );
}
