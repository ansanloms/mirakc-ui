import type { ComponentProps } from "preact";

import type { components } from "../../../hooks/api/schema.ts";
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
        <h3 class="font-bold text-lg mb-2">番組情報</h3>
        <ProgramItem program={recordingSchedule.program} />
      </article>
      <hr />
      <article>
        <h3 class="font-bold text-lg mb-2">録画情報</h3>
        <RecordingItem recordingSchedule={recordingSchedule} />
      </article>
      <hr />
      <article>
        <button onClick={handleRemoveRecordingSchedule}>
          録画キャンセル
        </button>
      </article>
    </section>
  );
}
