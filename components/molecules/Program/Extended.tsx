import type { components } from "../../../hooks/api/schema.d.ts";
import styles from "./Extended.module.css";

type Props = {
  /**
   * 番組。
   */
  program: components["schemas"]["MirakurunProgram"];
};

export default function ProgramExtended(props: Props) {
  return (
    <dl class={styles.list}>
      {Object.entries(props.program.extended ?? {}).map(([k, v]) => (
        <>
          <dt class={styles.term}>{k}</dt>
          <dd class={styles.definition}>{v}</dd>
        </>
      ))}
    </dl>
  );
}
