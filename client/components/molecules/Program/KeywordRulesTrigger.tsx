import Icon from "../../atoms/Icon.tsx";
import { t } from "../../../locales/i18n.ts";
import styles from "./KeywordRulesTrigger.module.css";

type Props = {
  /** キーワード自動録画の管理ページを開く。 */
  onOpen: () => void;
};

/** キーワード自動録画の管理ページを開くトリガー。 */
export default function KeywordRulesTrigger(props: Props) {
  return (
    <button
      type="button"
      className={styles.trigger}
      onClick={props.onOpen}
    >
      <Icon size={16}>label</Icon>
      <span className={styles.text}>{t("keyword.toolbar.open")}</span>
    </button>
  );
}
