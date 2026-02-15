import type { ComponentProps } from "preact";
import styles from "./Button.module.css";

type Props = ComponentProps<"button">;

export default function Button({ children, ...props }: Props) {
  return (
    <button
      class={styles.button}
      {...props}
    >
      {children}
    </button>
  );
}
