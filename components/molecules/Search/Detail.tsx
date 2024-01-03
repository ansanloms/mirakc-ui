import type { components } from "../../../hooks/api/schema.d.ts";
import type { ComponentProps } from "preact";
import { t } from "../../../locales/i18n.ts";
import ProgramItem from "../Program/Item.tsx";
import RecordingItem from "../Recording/Item.tsx";

type Props = {
  program: ComponentProps<
    typeof ProgramItem
  >["program"];
  recordingSchedule?: ComponentProps<
    typeof RecordingItem
  >["recordingSchedule"];
  addRecordingSchedule: (
    program: ComponentProps<
      typeof ProgramItem
    >["program"],
  ) => Promise<void>;
  removeRecordingSchedule: (
    program: ComponentProps<
      typeof ProgramItem
    >["program"],
  ) => Promise<void>;
};

export default function ProgramDetail(
  {
    program,
    recordingSchedule,
    addRecordingSchedule,
    removeRecordingSchedule,
  }: Props,
) {
  const handleAddRecordingSchedule = () => {
    addRecordingSchedule(program);
  };

  const handleRemoveRecordingSchedule = () => {
    removeRecordingSchedule(program);
  };

  return (
    <section
      class={[
        "grid",
        "gap-4",
        "p-4",
        "border-2",
        "bg-gray-100",
        "border-gray-400",
        "rounded",
        "shadow-md",
      ]}
    >
      <article>
        <ProgramItem program={program} />
      </article>
      <hr />
      {recordingSchedule && (
        <>
          <article>
            <RecordingItem recordingSchedule={recordingSchedule} />
          </article>
          <hr />
        </>
      )}
      <article>
        {!recordingSchedule && (
          <button onClick={handleAddRecordingSchedule}>
            {t("recording.record")}
          </button>
        )}
        {recordingSchedule && (
          <button onClick={handleRemoveRecordingSchedule}>
            {t("recording.cancel")}
          </button>
        )}
      </article>
    </section>
  );
}
