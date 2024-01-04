import { t } from "../../../locales/i18n.ts";
import type { ComponentProps } from "preact";
import type { components } from "../../../hooks/api/schema.d.ts";
import Icon from "../../atoms/Icon.tsx";
import Button from "../../atoms/Button.tsx";
import RecordingItem from "./Item.tsx";
import ProgramItem from "../Program/Item.tsx";

type Props = {
  /**
   * 録画予約。
   */
  recordingSchedule: ComponentProps<
    typeof RecordingItem
  >["recordingSchedule"];

  /**
   * 録画予約解除する。
   */
  removeRecordingSchedule: (
    program: components["schemas"]["MirakurunProgram"],
  ) => Promise<void>;

  /**
   * 更新中。
   */
  loading: boolean;
};

export default function RecordingDetail(
  props: Props,
) {
  const handleRemoveRecordingSchedule = () => {
    props.removeRecordingSchedule(props.recordingSchedule.program);
  };

  return (
    <section
      class={[
        "flex",
        "flex-col",
        "gap-4",
      ]}
    >
      <article>
        <ProgramItem program={props.recordingSchedule.program} />
      </article>
      <hr class={["mt-auto"]} />
      <article>
        <RecordingItem recordingSchedule={props.recordingSchedule} />
      </article>
      <article class={["grid"]}>
        {props.loading && (
          <div class={["grid", "place-content-center"]}>
            <Icon spin={true}>sync</Icon>
          </div>
        )}
        {!props.loading &&
          (
            <Button
              onClick={handleRemoveRecordingSchedule}
            >
              {t("recording.cancel")}
            </Button>
          )}
      </article>
    </section>
  );
}
