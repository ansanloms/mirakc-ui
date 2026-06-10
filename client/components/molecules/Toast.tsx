import Icon from "../atoms/Icon.tsx";
import styles from "./Toast.module.css";

type Props = {
  /** 表示するメッセージ。 */
  message: string;

  /** 成功 / 失敗の見た目。 */
  variant: "success" | "error";
};

/**
 * 画面下部のトースト。表示の自動消去は呼び出し側 (hooks/use-toast.ts) が
 * 管理し、このコンポーネントは表示専用。
 */
export default function Toast(props: Props) {
  return (
    <div
      role="status"
      className={`${styles.toast} ${
        props.variant === "error" ? styles.error : styles.success
      }`}
    >
      <Icon size={16}>
        {props.variant === "error" ? "error" : "check_circle"}
      </Icon>
      {props.message}
    </div>
  );
}
