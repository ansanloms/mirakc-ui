import type { ComponentProps } from "react";
import Icon from "./Icon.tsx";
import styles from "./IconButton.module.css";

type Props = Omit<ComponentProps<"button">, "children"> & {
  /** Material Symbols のアイコン名。 */
  icon: string;
  /** アクセシブルなラベル (aria-label)。 */
  label: string;
  /** アイコンサイズ (px)。 */
  size?: number;
};

/** 枠付きの正方形アイコンボタン (ツールバー等)。 */
export default function IconButton(
  { icon, label, size = 18, className, ...rest }: Props,
) {
  return (
    <button
      type="button"
      className={`${styles.button} ${className ?? ""}`}
      aria-label={label}
      {...rest}
    >
      <Icon size={size}>{icon}</Icon>
    </button>
  );
}
