import type { ComponentProps, JSX } from "preact";
import ProgramDetail from "../../../molecules/Program/Detail.tsx";
import Modal from "../../../atoms/Modal.tsx";
import { css } from "twind/css";

type Props = {
  /**
   * 番組。
   */
  program?: ComponentProps<typeof ProgramDetail>["program"];

  /**
   * 録画予約。
   */
  recordingSchedule?: ComponentProps<typeof ProgramDetail>["recordingSchedule"];

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

  /**
   * モーダル開閉状況。
   */
  open: ComponentProps<
    typeof Modal
  >["open"];

  /**
   * モーダルを閉じる際の処理。
   */
  onClose: ComponentProps<
    typeof Modal
  >["onClose"];
};

const style = {
  detail: css`
width: 72vw;
height: 64vh;
overflow: auto;
`,
};

export default function ProgramModalDetail(
  props: Props,
) {
  return (
    <Modal
      open={props.open}
      onClose={props.onClose}
    >
      <div class={[style.detail, "p-4", "bg-white"]}>
        {props.program && (
          <ProgramDetail
            program={props.program}
            recordingSchedule={props.recordingSchedule}
            addRecordingSchedule={props.addRecordingSchedule}
            removeRecordingSchedule={props.removeRecordingSchedule}
            loading={props.loading}
          />
        )}
      </div>
    </Modal>
  );
}
