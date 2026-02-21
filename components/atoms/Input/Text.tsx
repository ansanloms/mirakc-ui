import type { ComponentProps } from "preact";
import styles from "./Text.module.css";

type Props = Omit<ComponentProps<"input">, "type">;

export default function InputText(props: Props) {
  return (
    <input
      type="text"
      class={styles.input}
      {...props}
    />
  );
}
