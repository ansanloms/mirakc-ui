import type { components } from "../../../lib/api/schema.d.ts";
import { isValidNicoliveChannelId } from "../../../../server/lib/niconico-settings.ts";
import {
  CHANNEL_TYPES,
  channelTypeLabel,
  serviceNumber,
} from "../../../lib/service.ts";
import Icon from "../../atoms/Icon.tsx";
import { t } from "../../../locales/i18n.ts";
import styles from "./ChannelMapCard.module.css";

type Service = components["schemas"]["MirakurunService"];

/** 設定フォームの 1 行。key は React の安定キー (テンプレートが採番)。 */
export type MappingRow = {
  key: number;
  /** mirakc の複合サービス ID。未選択は null。 */
  serviceId: number | null;
  /** ニコニコチャンネル ID の入力値 (未検証)。 */
  nicoliveChannelId: string;
};

type Props = {
  /** 表示する行 (編集中 draft)。 */
  rows: MappingRow[];

  /** チャンネル選択肢 (mirakc のサービス一覧)。 */
  services: Service[];

  /** 複数行に割り当てられているニコニコチャンネル ID (行のエラー表示)。 */
  duplicateIds: Set<string>;

  /** ch数字 形式でない行数 (エラーメッセージの件数表示)。 */
  invalidCount: number;

  onChangeRow: (
    key: number,
    patch: Partial<Pick<MappingRow, "serviceId" | "nicoliveChannelId">>,
  ) => void;

  /** 行を追加する。afterKey の直後 (null なら末尾) に挿入する。 */
  onAddRow: (afterKey: number | null) => void;

  onRemoveRow: (key: number) => void;
};

/**
 * チャンネル割り当てカード (design .set-card + .map-row)。
 * `チャンネル選択 (select) : ニコニコ実況 ID (input) [+][-]` の行を並べる。
 * 行の状態・自動補完・検証はテンプレート側が持ち、ここは表示に徹する。
 */
export default function ChannelMapCard(props: Props) {
  const rowBad = (row: MappingRow): boolean => {
    const value = row.nicoliveChannelId.trim();
    return (value !== "" && !isValidNicoliveChannelId(value)) ||
      props.duplicateIds.has(value);
  };

  return (
    <section className={styles.card}>
      <div className={styles.head}>
        <span className={styles.headIcon}>
          <Icon size={20}>forum</Icon>
        </span>
        <div>
          <h2 className={styles.title}>{t("niconico.card.title")}</h2>
          <p className={styles.description}>{t("niconico.card.description")}</p>
        </div>
      </div>

      <div className={styles.body}>
        {props.rows.length > 0 && (
          <div className={styles.tableHead}>
            <span className={styles.headChannel}>
              {t("niconico.table.channel")}
            </span>
            <span>{t("niconico.table.channelId")}</span>
          </div>
        )}

        {props.rows.length === 0
          ? <div className={styles.empty}>{t("niconico.empty")}</div>
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
                  <div key={row.key} className={styles.row}>
                    <select
                      className={`${styles.select} ${
                        row.serviceId === null ? styles.selectEmpty : ""
                      }`}
                      value={row.serviceId === null
                        ? ""
                        : String(row.serviceId)}
                      onChange={(e) =>
                        props.onChangeRow(row.key, {
                          serviceId: e.target.value === ""
                            ? null
                            : Number(e.target.value),
                        })}
                      aria-label={t("niconico.row.selectLabel")}
                    >
                      <option value="">
                        {t("niconico.row.selectChannel")}
                      </option>
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
                      value={row.nicoliveChannelId}
                      placeholder={t("niconico.row.placeholder")}
                      spellCheck={false}
                      onChange={(e) =>
                        props.onChangeRow(row.key, {
                          nicoliveChannelId: e.target.value,
                        })}
                      aria-label={t("niconico.row.inputLabel")}
                    />
                    <button
                      type="button"
                      className={styles.rowButton}
                      onClick={() => props.onAddRow(row.key)}
                      aria-label={t("niconico.row.add")}
                      title={t("niconico.row.add")}
                    >
                      <Icon size={15}>add</Icon>
                    </button>
                    <button
                      type="button"
                      className={`${styles.rowButton} ${styles.danger}`}
                      onClick={() => props.onRemoveRow(row.key)}
                      aria-label={t("niconico.row.remove")}
                      title={t("niconico.row.remove")}
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
          onClick={() => props.onAddRow(null)}
        >
          <Icon size={15}>add</Icon>
          {t("niconico.addRow")}
        </button>

        {props.invalidCount > 0 && (
          <p className={styles.fieldError}>
            {t("niconico.error.format", { count: props.invalidCount })}
          </p>
        )}
        {props.duplicateIds.size > 0 && (
          <p className={styles.fieldError}>
            {t("niconico.error.duplicate", {
              ids: [...props.duplicateIds].join(", "),
            })}
          </p>
        )}
        <p className={styles.fieldHint}>{t("niconico.hint")}</p>
      </div>
    </section>
  );
}
