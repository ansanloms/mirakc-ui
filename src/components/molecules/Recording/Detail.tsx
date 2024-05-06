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
   * 詳細をクリック。
   */
  onClick: () => Promise<void>;
};

export default function RecordingDetail(
  props: Props,
) {
  const handleClick = () => {
  };

  return (
    <section class={["flex", "flex-col", "gap-4"]}>
      <article>
        <ProgramItem program={props.recordingSchedule.program} />
      </article>
      <article>
        <RecordingItem recordingSchedule={props.recordingSchedule} />
      </article>
      <article class={["grid"]}>
        <Button onClick={props.onClick}>
          {t("common.detail")}
        </Button>
      </article>
    </section>
  );
}
