import { t } from "../../locales/i18n.ts";
import styles from "./StatusBadge.module.css";

export type StatusKind =
  | "live"
  | "new"
  | "reserved"
  | "recording"
  | "failed"
  | "recorded";

type Props = {
  /** バッジ種別。 */
  kind: StatusKind;
};

/** LIVE / 新 / 予約 / 録画中 / 失敗 / 録画済 のステータスバッジ。 */
export default function StatusBadge({ kind }: Props) {
  const label: Record<StatusKind, string> = {
    live: "LIVE",
    new: t("program.badge.new"),
    reserved: t("program.badge.reserved"),
    recording: t("program.badge.recording"),
    failed: t("program.badge.failed"),
    recorded: t("program.badge.recorded"),
  };
  return (
    <span className={`${styles.badge} ${styles[kind]}`}>
      {kind === "recording" && <span className={styles.dot} />}
      {label[kind]}
    </span>
  );
}
