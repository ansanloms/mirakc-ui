import type { ComponentProps } from "preact";
import RecordingList from "../organisms/Recording/List.tsx";

type Props = {
  /**
   * 録画一覧。
   */
  recordingSchedules: ComponentProps<
    typeof RecordingList
  >["recordingSchedules"];
};

export default function Recording(
  props: Props,
) {
  return (
    <div class={["container", "h-full", "mx-auto", "p-4"]}>
      <section>
        <RecordingList
          recordingSchedules={props.recordingSchedules}
        />
      </section>
    </div>
  );
}
