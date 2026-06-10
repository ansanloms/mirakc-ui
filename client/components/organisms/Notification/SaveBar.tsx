import Icon from "../../atoms/Icon.tsx";
import { t } from "../../../locales/i18n.ts";
import styles from "./SaveBar.module.css";

type Props = {
  /** 未保存の変更があるか。 */
  dirty: boolean;

  /** 保存処理中。 */
  saving: boolean;

  /** 入力エラー等で保存できない状態。 */
  disabled?: boolean;

  /** 保存する。 */
  onSave: () => void;
};

/** 保存バー。保存ボタンと未保存ピル。 */
export default function SaveBar(props: Props) {
  return (
    <div className={styles.bar}>
      <button
        type="button"
        className={styles.save}
        disabled={!props.dirty || props.saving || props.disabled}
        onClick={props.onSave}
      >
        <Icon size={16}>check</Icon>
        {t("notification.save")}
      </button>
      {props.dirty && (
        <span className={styles.dirtyPill}>
          <span className={styles.dirtyDot} />
          {t("notification.dirty")}
        </span>
      )}
    </div>
  );
}
