import type { components } from "../../../hooks/api/schema.d.ts";
import * as datetime from "@std/datetime";
import styles from "./Item.module.css";

type Props = {
  /**
   * 番組。
   */
  program: components["schemas"]["MirakurunProgram"];
};

export default function ProgramItem(props: Props) {
  const startAt = new Date(props.program.startAt);
  const endAt = new Date(props.program.startAt + props.program.duration);

  return (
    <div class={styles.container}>
      <h2 class={styles.title}>
        {props.program.name ?? ""}
      </h2>
      <p class={styles.time}>
        {datetime.format(startAt, "yyyy-MM-dd H:mm")}
        {" - "}
        {datetime.format(endAt, "H:mm")}
      </p>
      {props.program.description && (
        <p class={styles.description}>
          {props.program.description}
        </p>
      )}
    </div>
  );
}
