import type { ComponentProps } from "react";
import { t } from "../../../locales/i18n.ts";
import Button from "../../atoms/Button.tsx";
import ProgramItem from "../Program/Item.tsx";
import RecordingItem from "../Recording/Item.tsx";
import styles from "./Detail.module.css";

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
   * 詳細をクリック。
   */
  onClick: () => void;
};

export default function SearchDetail(props: Props) {
  return (
    <section className={styles.section}>
      <article>
        <ProgramItem program={props.program} />
      </article>
      {props.recordingSchedule && (
        <article>
          <RecordingItem recordingSchedule={props.recordingSchedule} />
        </article>
      )}
      <article className={styles.actions}>
        <Button onClick={props.onClick}>
          {t("common.detail")}
        </Button>
      </article>
    </section>
  );
}
