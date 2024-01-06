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
};

export default function SearchDetail(
  props: Props,
) {
  const handleClick = () => {
    location.href = `/program?p=${props.program.id}`;
  };

  return (
    <section class={["flex", "flex-col", "gap-4"]}>
      <article>
        <ProgramItem program={props.program} />
      </article>
      {props.recordingSchedule && (
        <article>
          <RecordingItem recordingSchedule={props.recordingSchedule} />
        </article>
      )}
      <article class={["grid"]}>
        <Button onClick={handleClick}>
          {t("common.detail")}
        </Button>
      </article>
    </section>
  );
}
