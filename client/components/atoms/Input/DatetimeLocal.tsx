import type { ComponentProps } from "react";
import styles from "./DatetimeLocal.module.css";

type Props = Omit<ComponentProps<"input">, "type">;

export default function InputDatetimeLocal(props: Props) {
  return (
    <input
      type="datetime-local"
      className={styles.input}
      {...props}
    />
  );
}
