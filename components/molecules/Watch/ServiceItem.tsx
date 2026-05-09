import type { components } from "../../../hooks/api/schema.d.ts";
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
  return (
    <div
      class={styles.container}
      data-active={props.active}
      onClick={props.onClick}
    >
      <p class={styles.name}>{props.service.name}</p>
      <p class={styles.channel}>
        {props.service.channel?.type} {props.service.channel?.channel}
      </p>
    </div>
  );
}
