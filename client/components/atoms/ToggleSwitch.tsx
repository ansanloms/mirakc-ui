import styles from "./ToggleSwitch.module.css";

type Props = {
  /** ON/OFF 状態。 */
  checked: boolean;

  /** アクセシブルなラベル (aria-label)。 */
  label: string;

  /** 操作を受け付けない状態。 */
  disabled?: boolean;

  /** 切り替え操作。 */
  onToggle: () => void;

  /** 配置調整用の追加クラス。 */
  className?: string;
};

/** ON/OFF トグルスイッチ (role="switch")。 */
export default function ToggleSwitch(props: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={props.checked}
      aria-label={props.label}
      className={`${styles.sw} ${props.checked ? styles.on : ""} ${
        props.className ?? ""
      }`}
      disabled={props.disabled}
      onClick={props.onToggle}
    />
  );
}
