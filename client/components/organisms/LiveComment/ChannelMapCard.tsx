import type { components } from "../../../lib/api/schema.d.ts";
import {
  isValidChannelId,
  type LiveCommentSourceId,
} from "../../../../server/lib/live-comment-settings.ts";
import {
  CHANNEL_TYPES,
  channelTypeLabel,
  serviceNumber,
} from "../../../lib/service.ts";
import { commentSourceLabel } from "../../../lib/comment-source.ts";
import Icon from "../../atoms/Icon.tsx";
import ToggleSwitch from "../../atoms/ToggleSwitch.tsx";
import { t } from "../../../locales/i18n.ts";
import styles from "./ChannelMapCard.module.css";

type Service = components["schemas"]["MirakurunService"];

/** 設定フォームの 1 行。key は React の安定キー (テンプレートが採番)。 */
export type MappingRow = {
  key: number;
  /** mirakc の複合サービス ID。未選択は null。 */
  serviceId: number | null;
  /** 取得元のチャンネル ID の入力値 (未検証)。 */
  channelId: string;
  /** 有効な割り当てか。無効行は薄く表示し、検証・保存解決から外れる。 */
  enabled: boolean;
};

type RowPatch = Partial<Pick<MappingRow, "serviceId" | "channelId" | "enabled">>;

type Props = {
  /** 対象の取得元 (ID 形式・placeholder・ヒントの切替)。 */
  source: LiveCommentSourceId;

  /** 表示する行 (編集中 draft)。 */
  rows: MappingRow[];

  /** チャンネル選択肢 (mirakc のサービス一覧)。 */
  services: Service[];

  /** 複数の有効行に割り当てられているチャンネル ID (行のエラー表示)。 */
  duplicateIds: Set<string>;

  /** 形式不正の有効行数 (エラーメッセージの件数表示)。 */
  invalidCount: number;

  onChangeRow: (key: number, patch: RowPatch) => void;

  /** 行を末尾に追加する。 */
  onAddRow: () => void;

  onRemoveRow: (key: number) => void;
};

/**
 * チャンネル割り当てカード (design .set-card + .map-row)。
 * `[有効スイッチ] チャンネル (select) : 実況 ID (input) [−]` の行を並べる。
 * ID 形式・placeholder・ヒントは取得元 (source) で切り替える。行の状態・
 * 自動補完・検証はテンプレート側が持ち、ここは表示に徹する。
 */
export default function ChannelMapCard(props: Props) {
  const sourceLabel = commentSourceLabel(props.source);
  const format = t(`liveComment.format.${props.source}`);
  const placeholder = t(`liveComment.row.placeholder.${props.source}`);

  const rowBad = (row: MappingRow): boolean => {
    if (!row.enabled) {
      return false;
    }
    const value = row.channelId.trim();
    if (value === "") {
      return false;
    }
    return !isValidChannelId(props.source, value) ||
      props.duplicateIds.has(value);
  };

  return (
    <section className={styles.card}>
      <div className={styles.head}>
        <span className={styles.headIcon}>
          <Icon size={20}>forum</Icon>
        </span>
        <div>
          <h2 className={styles.title}>{t("liveComment.card.title")}</h2>
          <p className={styles.description}>
            {t("liveComment.card.description", { source: sourceLabel })}
          </p>
        </div>
      </div>

      <div className={styles.body}>
        {props.rows.length > 0 && (
          <div className={styles.tableHead}>
            <span className={styles.toggleCol} />
            <span className={styles.headChannel}>
              {t("liveComment.table.channel")}
            </span>
            <span>
              {t("liveComment.table.channelId", { source: sourceLabel, format })}
            </span>
          </div>
        )}

        {props.rows.length === 0
          ? <div className={styles.empty}>{t("liveComment.empty")}</div>
          : (
            <div className={styles.list}>
              {props.rows.map((row) => {
                const usedElsewhere = new Set(
                  props.rows
                    .filter((other) =>
                      other.key !== row.key && other.serviceId !== null
                    )
                    .map((other) => other.serviceId),
                );
                return (
                  <div
                    key={row.key}
                    className={`${styles.row} ${row.enabled ? "" : styles.off}`}
                  >
                    <ToggleSwitch
                      checked={row.enabled}
                      label={row.enabled
                        ? t("liveComment.row.disable")
                        : t("liveComment.row.enable")}
                      onToggle={() =>
                        props.onChangeRow(row.key, { enabled: !row.enabled })}
                    />
                    <select
                      className={`${styles.select} ${
                        row.serviceId === null ? styles.selectEmpty : ""
                      }`}
                      value={row.serviceId === null ? "" : String(row.serviceId)}
                      onChange={(e) =>
                        props.onChangeRow(row.key, {
                          serviceId: e.target.value === ""
                            ? null
                            : Number(e.target.value),
                        })}
                      aria-label={t("liveComment.row.selectLabel")}
                    >
                      <option value="">{t("liveComment.row.selectChannel")}</option>
                      {CHANNEL_TYPES.map((type) => {
                        const group = props.services.filter(
                          (service) => service.channel.type === type,
                        );
                        if (group.length === 0) {
                          return null;
                        }
                        return (
                          <optgroup key={type} label={channelTypeLabel(type)}>
                            {group.map((service) => (
                              <option
                                key={service.id}
                                value={String(service.id)}
                                disabled={usedElsewhere.has(service.id)}
                              >
                                {`${serviceNumber(service)}　${service.name}`}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
                    </select>
                    <span className={styles.separator}>:</span>
                    <input
                      className={`${styles.input} ${
                        rowBad(row) ? styles.inputBad : ""
                      }`}
                      value={row.channelId}
                      placeholder={placeholder}
                      spellCheck={false}
                      onChange={(e) =>
                        props.onChangeRow(row.key, { channelId: e.target.value })}
                      aria-label={t("liveComment.row.inputLabel")}
                    />
                    <button
                      type="button"
                      className={`${styles.rowButton} ${styles.danger}`}
                      onClick={() => props.onRemoveRow(row.key)}
                      aria-label={t("liveComment.row.remove")}
                      title={t("liveComment.row.remove")}
                    >
                      <Icon size={15}>remove</Icon>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

        <button
          type="button"
          className={styles.addRow}
          onClick={props.onAddRow}
        >
          <Icon size={15}>add</Icon>
          {t("liveComment.addRow")}
        </button>

        {props.invalidCount > 0 && (
          <p className={styles.fieldError}>
            {t("liveComment.error.format", {
              format,
              count: props.invalidCount,
            })}
          </p>
        )}
        {props.duplicateIds.size > 0 && (
          <p className={styles.fieldError}>
            {t("liveComment.error.duplicate", {
              ids: [...props.duplicateIds].join(", "),
            })}
          </p>
        )}
        <p className={styles.fieldHint}>
          {t(`liveComment.hint.${props.source}`)} {t("liveComment.hintSuffix")}
        </p>
      </div>
    </section>
  );
}
