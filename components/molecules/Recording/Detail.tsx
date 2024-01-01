import { t } from "../../../locales/i18n.ts";
import type { ComponentProps } from "preact";

import type { components } from "../../../hooks/api/schema.d.ts";
import RecordingItem from "./Item.tsx";
import ProgramItem from "../Program/Item.tsx";

type Props = {
  recordingSchedule: ComponentProps<
    typeof RecordingItem
  >["recordingSchedule"];
  removeRecordingSchedule: (
    recordingSchedule: components["schemas"]["WebRecordingSchedule"],
  ) => Promise<void>;
};

export default function RecordingList(
  { recordingSchedule, removeRecordingSchedule }: Props,
) {
  const handleRemoveRecordingSchedule = () => {
    removeRecordingSchedule(recordingSchedule);
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
        <ProgramItem program={recordingSchedule.program} />
      </article>
      <hr />
      <article>
        <RecordingItem recordingSchedule={recordingSchedule} />
      </article>
      <hr />
      <article>
        <button onClick={handleRemoveRecordingSchedule}>
          {t("recording.cancel")}
        </button>
      </article>
    </section>
  );
}
