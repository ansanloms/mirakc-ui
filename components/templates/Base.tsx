import { ComponentChildren } from "preact";
import Menu from "../organisms/Menu.tsx";
import styles from "./Base.module.css";

type Props = {
  children: ComponentChildren;
};

export default function Base({ children }: Props) {
  return (
    <div class={styles.layout}>
      <div class={styles.sidebar}>
        <Menu />
      </div>
      <div class={styles.content}>
        {children}
      </div>
    </div>
  );
}
