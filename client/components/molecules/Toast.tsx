import Icon from "../atoms/Icon.tsx";
import styles from "./Toast.module.css";

type Props = {
  /** 表示するメッセージ。 */
  message: string;

  /** 成功 / 失敗の見た目。 */
  variant: "success" | "error";

  /** 退場アニメーションを再生する (アンマウントは呼び出し側が行う)。 */
  leaving?: boolean;
};

/**
 * 画面下部のトースト。登場・退場アニメーション付き。表示の自動消去
 * (leaving への遷移とアンマウント) は呼び出し側 (hooks/use-toast.ts) が
 * 管理し、このコンポーネントは表示専用。
 */
export default function Toast(props: Props) {
  return (
    <div
      role="status"
      className={`${styles.toast} ${
        props.variant === "error" ? styles.error : styles.success
      } ${props.leaving ? styles.leaving : ""}`}
    >
      <Icon size={16}>
        {props.variant === "error" ? "error" : "check_circle"}
      </Icon>
      {props.message}
    </div>
  );
}
