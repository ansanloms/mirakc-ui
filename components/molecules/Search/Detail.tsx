import type { components } from "../../../hooks/api/schema.d.ts";
import type { ComponentProps } from "preact";
import { t } from "../../../locales/i18n.ts";
import Icon from "../../atoms/Icon.tsx";
import Button from "../../atoms/Button.tsx";
import ProgramItem from "../Program/Item.tsx";
import RecordingItem from "../Recording/Item.tsx";

type Props = {
  /**
   * 番組。
   */
  program: ComponentProps<
    typeof ProgramItem
  >["program"];

  /**
   * 録画予約。
   */
  recordingSchedule?: ComponentProps<
    typeof RecordingItem
  >["recordingSchedule"];

  /**
   * 録画予約する。
   */
  addRecordingSchedule: (
    program: ComponentProps<
      typeof ProgramItem
    >["program"],
  ) => Promise<void>;

  /**
   * 録画予約解除する。
   */
  removeRecordingSchedule: (
    program: ComponentProps<
      typeof ProgramItem
    >["program"],
  ) => Promise<void>;

  /**
   * 更新中。
   */
  loading: boolean;
};

export default function ProgramDetail(
  props: Props,
) {
  const handleToggleRecordingSchedule = () => {
    if (props.loading) {
      return;
    }

    if (props.recordingSchedule) {
      props.removeRecordingSchedule(props.program);
    } else {
      props.addRecordingSchedule(props.program);
    }
  };

  return (
    <section class={["flex", "flex-col", "gap-4"]}>
      <article>
        <ProgramItem program={props.program} />
      </article>
      <hr class={["mt-auto"]} />
      {props.recordingSchedule && (
        <article>
          <RecordingItem recordingSchedule={props.recordingSchedule} />
        </article>
      )}
      <article class={["grid"]}>
        {props.loading && (
          <div class={["grid", "place-content-center"]}>
            <Icon spin={true}>sync</Icon>
          </div>
        )}
        {!props.loading &&
          (
            <Button
              onClick={handleToggleRecordingSchedule}
            >
              {t(`recording.${props.recordingSchedule ? "cancel" : "record"}`)}
            </Button>
          )}
      </article>
    </section>
  );
}
