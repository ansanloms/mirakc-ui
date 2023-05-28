import type { ComponentProps, JSX } from "preact";
import * as datetime from "$std/datetime/mod.ts";
import ProgramList from "../organisms/Program/List.tsx";
import ProgramDetail from "../molecules/Program/Detail.tsx";
import Modal from "../atoms/Modal.tsx";
import { css } from "twind/css";

type Props = {
  services: ComponentProps<typeof ProgramList>["services"];
  programs: ComponentProps<typeof ProgramList>["programs"];
  selectedDate: Date;
  setSelectedDate: (selectedDate: Date) => void;

  selectedProgram: ComponentProps<typeof ProgramDetail>["program"] | undefined;
  selectedProgramRecordingSchedule:
    | ComponentProps<typeof ProgramDetail>["recordingSchedule"]
    | undefined;
  setSelectedProgram: ComponentProps<typeof ProgramList>["setSelectedProgram"];
  addRecordingSchedule: ComponentProps<
    typeof ProgramDetail
  >["addRecordingSchedule"];
  removeRecordingSchedule: ComponentProps<
    typeof ProgramDetail
  >["removeRecordingSchedule"];
  isDuringScheduling: ComponentProps<
    typeof ProgramDetail
  >["isDuringScheduling"];
};

const style = {
  detail: css`
width: 72vw;
height: 64vh;
overflow: auto;
`,
};

export default function Program(
  {
    services,
    programs,
    selectedDate,
    setSelectedDate,
    selectedProgram,
    setSelectedProgram,
    selectedProgramRecordingSchedule,
    addRecordingSchedule,
    removeRecordingSchedule,
    isDuringScheduling,
  }: Props,
) {
  const handleSetSelectedDate: JSX.GenericEventHandler<HTMLInputElement> = (
    event,
  ) => {
    setSelectedDate(new Date(event.currentTarget.value));
  };

  const handleCloseDialog = () => {
    setSelectedProgram(undefined);
  };

  return (
    <>
      <section class={["grid", "w-full", "h-screen"]}>
        <div>
          <input
            type="datetime-local"
            value={datetime.format(selectedDate, "yyyy-MM-ddTHH:mm")}
            onChange={handleSetSelectedDate}
          />
        </div>
        <ProgramList
          services={services}
          programs={programs}
          targetDate={selectedDate}
          setSelectedProgram={setSelectedProgram}
        />
      </section>
      <Modal
        open={!!selectedProgram}
        onClose={handleCloseDialog}
      >
        {selectedProgram && (
          <div class={[style.detail, "p-4", "bg-white"]}>
            <ProgramDetail
              program={selectedProgram}
              recordingSchedule={selectedProgramRecordingSchedule}
              addRecordingSchedule={addRecordingSchedule}
              removeRecordingSchedule={removeRecordingSchedule}
              isDuringScheduling={isDuringScheduling}
            />
          </div>
        )}
      </Modal>
    </>
  );
}
