import type { ReactNode } from "react";
import styles from "./Kbd.module.css";

type Props = {
  /** 表示するキー表記（例: "Ctrl+K" / "⌘K"）。整形は呼び出し側（hooks の formatHotkey 等）で行う。 */
  children: ReactNode;
  /** レイアウト・表示制御用に外から足すクラス（自身の class と併合する）。 */
  className?: string;
};

/** キーボードショートカットの表記バッジ。`<kbd>` 要素として描画する。 */
export default function Kbd({ children, className }: Props) {
  return (
    <kbd className={className ? `${styles.kbd} ${className}` : styles.kbd}>
      {children}
    </kbd>
  );
}
