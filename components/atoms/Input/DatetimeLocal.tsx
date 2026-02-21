import type { ComponentProps } from "preact";
import styles from "./DatetimeLocal.module.css";

type Props = Omit<ComponentProps<"input">, "type">;

export default function InputDatetimeLocal(props: Props) {
  return (
    <input
      type="datetime-local"
      class={styles.input}
      {...props}
    />
  );
}
