import type { ComponentProps } from "preact";
import * as datetime from "@std/datetime";
import ProgramTable from "../organisms/Program/Table.tsx";
import ProgramFormTargetDate from "../organisms/Program/Form/TargetDate.tsx";
import styles from "./Program.module.css";

type Props = {
  /**
   * 配局一覧。
   */
  services: ComponentProps<typeof ProgramTable>["services"];

  /**
   * 番組一覧。
   */
  programs: ComponentProps<typeof ProgramTable>["programs"];

  /**
   * 録画予約一覧。
   */
  recordingSchedules: ComponentProps<typeof ProgramTable>["recordingSchedules"];

  /**
   * 表示日時。
   */
  targetDate: Date;

  /**
   * 表示日時を設定する。
   */
  setTargetDate: (targetDate: Date) => void;

  /**
   * 番組を選択する。
   */
  setProgram: ComponentProps<typeof ProgramTable>["setProgram"];
};

export default function Program(props: Props) {
  const handleSetTargetDate = (targetDate: Date) => {
    props.setTargetDate(targetDate);
  };

  const displayFrom = new Date(
    datetime.format(props.targetDate, "yyyy-MM-ddTHH:00:00"),
  );
  const displayTo = new Date(displayFrom.getTime() + (24 * 60 * 60 * 1000));

  return (
    <section class={styles.section}>
      <ProgramFormTargetDate
        inputs={{ targetDate: props.targetDate }}
        onChange={({ targetDate }) => handleSetTargetDate(targetDate)}
      />
      <ProgramTable
        services={props.services}
        programs={props.programs}
        recordingSchedules={props.recordingSchedules}
        displayFrom={displayFrom}
        displayTo={displayTo}
        setProgram={props.setProgram}
      />
    </section>
  );
}
