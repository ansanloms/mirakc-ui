import type { ComponentProps } from "react";
import styles from "./Text.module.css";

type Props = Omit<ComponentProps<"input">, "type">;

export default function InputText(props: Props) {
  return (
    <input
      type="text"
      className={styles.input}
      {...props}
    />
  );
}
