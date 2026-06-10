import Icon from "../../atoms/Icon.tsx";
import Kbd from "../../atoms/Kbd.tsx";
import { formatHotkey } from "../../../hooks/use-hotkey.ts";
import { t } from "../../../locales/i18n.ts";
import styles from "./SearchTrigger.module.css";

/**
 * 検索モーダルを開くショートカットの binding。リスナ（route 側の useHotkey）と
 * バッジ表記（formatHotkey）の単一ソース。`mod` は Mac=⌘ / それ以外=Ctrl に解決する。
 */
export const SEARCH_HOTKEY = "mod+k";

type Props = {
  /** 検索モーダルを開く。 */
  onOpen: () => void;
};

/** 検索モーダルを開くトリガー（ショートカット表記付き）。 */
export default function SearchTrigger(props: Props) {
  return (
    <button
      type="button"
      className={styles.searchTrigger}
      onClick={props.onOpen}
    >
      <Icon size={16}>search</Icon>
      <span className={styles.text}>{t("program.toolbar.search")}</span>
      <Kbd className={styles.hint}>{formatHotkey(SEARCH_HOTKEY)}</Kbd>
    </button>
  );
}
