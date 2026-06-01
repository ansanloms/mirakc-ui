import { Fragment } from "react";
import type { components } from "../../../lib/api/schema.d.ts";
import styles from "./Extended.module.css";

type Props = {
  /**
   * 番組。
   */
  program: components["schemas"]["MirakurunProgram"];
};

export default function ProgramExtended(props: Props) {
  return (
    <dl className={styles.list}>
      {Object.entries(props.program.extended ?? {}).map(([k, v]) => (
        <Fragment key={k}>
          <dt className={styles.term}>{k}</dt>
          <dd className={styles.definition}>{v}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
