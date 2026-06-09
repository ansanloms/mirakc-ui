import { t } from "../../locales/i18n.ts";
import styles from "./StatusBadge.module.css";

export type StatusKind = "live" | "new";

type Props = {
  /** バッジ種別。 */
  kind: StatusKind;
};

/**
 * LIVE / 新 の汎用ステータスバッジ。
 * 録画スケジュールの状態 (録画予約 / 録画中 / 録画失敗 / 録画済) は
 * RecordingStatusBadge を使う。
 */
export default function StatusBadge({ kind }: Props) {
  const label: Record<StatusKind, string> = {
    live: "LIVE",
    new: t("program.badge.new"),
  };
  return (
    <span className={`${styles.badge} ${styles[kind]}`}>{label[kind]}</span>
  );
}
