import Icon from "../../atoms/Icon.tsx";
import { t } from "../../../locales/i18n.ts";
import styles from "./SearchTrigger.module.css";

type Props = {
  /** 検索モーダルを開く。 */
  onOpen: () => void;
};

/** 検索モーダルを開くトリガー（⌘K ヒント付き）。 */
export default function SearchTrigger(props: Props) {
  return (
    <button
      type="button"
      className={styles.searchTrigger}
      onClick={props.onOpen}
    >
      <Icon size={16}>search</Icon>
      <span className={styles.text}>{t("program.toolbar.search")}</span>
      <kbd className={styles.kbd}>⌘K</kbd>
    </button>
  );
}
