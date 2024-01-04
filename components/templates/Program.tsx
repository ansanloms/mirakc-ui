import type { ComponentProps, JSX } from "preact";
import * as datetime from "$std/datetime/mod.ts";
import ProgramTable from "../organisms/Program/Table.tsx";
import ProgramFormTargetDate from "../organisms/Program/Form/TargetDate.tsx";
import ProgramDetail from "../molecules/Program/Detail.tsx";
import Modal from "../atoms/Modal.tsx";
import { css } from "twind/css";

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
   * 選択している番組。
   */
  selectedProgram: ComponentProps<typeof ProgramDetail>["program"] | undefined;

  /**
   * 番組を選択する。
   */
  setSelectedProgram: ComponentProps<typeof ProgramTable>["setSelectedProgram"];

  /**
   * 録画予約する。
   */
  addRecordingSchedule: ComponentProps<
    typeof ProgramDetail
  >["addRecordingSchedule"];

  /**
   * 録画予約解除する。
   */
  removeRecordingSchedule: ComponentProps<
    typeof ProgramDetail
  >["removeRecordingSchedule"];

  /**
   * 読み込み中。
   */
  loading: boolean;
};

const style = {
  detail: css`
width: 72vw;
height: 64vh;
overflow: auto;
`,
};

export default function Program(
  props: Props,
) {
  const handleSetTargetDate = (targetDate: Date) => {
    props.setTargetDate(targetDate);
  };

  const handleCloseDialog = () => {
    props.setSelectedProgram(undefined);
  };

  const recordingSchedule = props.recordingSchedules.find(
    (recordingSchedule) =>
      recordingSchedule.program.id === props.selectedProgram?.id,
  );

  const displayFrom = new Date(
    datetime.format(props.targetDate, "yyyy-MM-ddTHH:00:00"),
  );
  const displayTo = new Date(displayFrom.getTime() + (24 * 60 * 60 * 1000));

  return (
    <>
      <section class={["grid", "w-full", "h-screen"]}>
        <ProgramFormTargetDate
          inputs={{ targetDate: props.targetDate || new Date() }}
          onChange={({ targetDate }) => handleSetTargetDate(targetDate)}
        />
        <ProgramTable
          services={props.services}
          programs={props.programs}
          recordingSchedules={props.recordingSchedules}
          displayFrom={displayFrom}
          displayTo={displayTo}
          setSelectedProgram={props.setSelectedProgram}
        />
      </section>
      <Modal
        open={!!props.selectedProgram}
        onClose={handleCloseDialog}
      >
        {props.selectedProgram && (
          <div class={[style.detail, "p-4", "bg-white"]}>
            <ProgramDetail
              program={props.selectedProgram}
              recordingSchedule={recordingSchedule}
              addRecordingSchedule={props.addRecordingSchedule}
              removeRecordingSchedule={props.removeRecordingSchedule}
              loading={props.loading}
            />
          </div>
        )}
      </Modal>
    </>
  );
}
