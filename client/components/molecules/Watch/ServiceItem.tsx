import type { components } from "../../../lib/api/schema.d.ts";
import styles from "./ServiceItem.module.css";

type Props = {
  /**
   * サービス。
   */
  service: components["schemas"]["MirakurunService"];

  /**
   * 選択中。
   */
  active: boolean;

  /**
   * 選択する。
   */
  onClick: () => void;
};

export default function WatchServiceItem(props: Props) {
  // #19: クリッカブル div を button にしてキーボード操作・スクリーンリーダーに対応。
  return (
    <button
      type="button"
      className={styles.container}
      data-active={props.active}
      onClick={props.onClick}
    >
      <span className={styles.name}>{props.service.name}</span>
      <span className={styles.channel}>
        {props.service.channel?.type} {props.service.channel?.channel}
      </span>
    </button>
  );
}
