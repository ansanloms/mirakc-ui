import type { components } from "../../../lib/api/schema.d.ts";
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
    <div className={styles.container}>
      <h2 className={styles.title}>
        {props.program.name ?? ""}
      </h2>
      <p className={styles.time}>
        {datetime.format(startAt, "yyyy-MM-dd H:mm")}
        {" - "}
        {datetime.format(endAt, "H:mm")}
      </p>
      {props.program.description && (
        <p className={styles.description}>
          {props.program.description}
        </p>
      )}
    </div>
  );
}
