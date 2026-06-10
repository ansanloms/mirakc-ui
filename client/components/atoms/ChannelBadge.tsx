import type { components } from "../../lib/api/schema.d.ts";
import { serviceColor, serviceNumber } from "../../lib/service.ts";
import styles from "./ChannelBadge.module.css";

type Service = components["schemas"]["MirakurunService"];

type Props = {
  /** サービス (チャンネル)。番号・色を導出する。 */
  service: Service;
  /** サイズ。 */
  size?: "xs" | "sm" | "md";
};

/** チャンネル番号バッジ。サービスから番号と色を導出する。 */
export default function ChannelBadge({ service, size = "md" }: Props) {
  return (
    <span
      className={`${styles.badge} ${styles[size]}`}
      style={{ background: serviceColor(service) }}
    >
      {serviceNumber(service)}
    </span>
  );
}
