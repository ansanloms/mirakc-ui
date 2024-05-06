import type { components } from "../../../hooks/api/schema.d.ts";
import * as datetime from "$std/datetime/mod.ts";
import { t } from "../../../locales/i18n.ts";
import Icon from "../../atoms/Icon.tsx";
import Button from "../../atoms/Button.tsx";
import ProgramItem from "./Item.tsx";
import ProgramExtended from "./Extended.tsx";
import RecordingItem from "../Recording/Item.tsx";

type Props = {
  /**
   * 番組。
   */
  program: components["schemas"]["MirakurunProgram"];

  /**
   * 録画予約。
   */
  recordingSchedule?: components["schemas"]["WebRecordingSchedule"] | undefined;

  /**
   * 録画予約する。
   */
  addRecordingSchedule: (
    program: components["schemas"]["MirakurunProgram"],
  ) => Promise<void>;

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
    <section class={["flex", "flex-col", "gap-4", "h-full"]}>
      <article>
        <ProgramItem program={props.program} />
      </article>
      {props.program.extended && (
        <article>
          <ProgramExtended program={props.program} />
        </article>
      )}
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
