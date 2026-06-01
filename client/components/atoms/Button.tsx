import type { ComponentProps } from "react";
import styles from "./Button.module.css";

type Props = ComponentProps<"button">;

export default function Button({ children, ...props }: Props) {
  return (
    <button
      className={styles.button}
      {...props}
    >
      {children}
    </button>
  );
}
