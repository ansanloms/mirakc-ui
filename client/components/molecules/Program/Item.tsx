import type { components } from "../../../lib/api/schema.d.ts";
import { formatHm, nowEpochMs } from "../../../lib/datetime.ts";
import StatusBadge from "../../atoms/StatusBadge.tsx";
import ScheduleStatusBadge from "../../atoms/ScheduleStatusBadge.tsx";
import styles from "./Item.module.css";

type RecordingScheduleState = components["schemas"]["RecordingScheduleState"];

type Props = {
  /** 番組。 */
  program: components["schemas"]["MirakurunProgram"];
  /** 録画スケジュールの状態 (予約/録画中/失敗/録画済)。無ければバッジを出さない。 */
  state?: RecordingScheduleState;
  /** 現在時刻 (ms)。LIVE 判定に使う。テスト時に固定できるよう注入可能。 */
  now?: number;
};

/** 番組表グリッドのセル内容。時刻 + LIVE バッジ + タイトル + 録画ステータスバッジ。 */
export default function ProgramItem(
  { program, state, now = nowEpochMs() }: Props,
) {
  const isLive = program.startAt <= now &&
    now < program.startAt + program.duration;

  return (
    <div className={styles.container}>
      {state && (
        <span className={styles.flagSlot}>
          <ScheduleStatusBadge state={state} />
        </span>
      )}
      <div className={styles.meta}>
        <span className={styles.time}>{formatHm(program.startAt)}</span>
        {isLive && <StatusBadge kind="live" />}
      </div>
      <p className={styles.title}>{program.name ?? ""}</p>
    </div>
  );
}
