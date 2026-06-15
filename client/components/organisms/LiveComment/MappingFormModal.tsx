import { useForm } from "@tanstack/react-form";
import {
  isValidChannelId,
  LIVE_COMMENT_SOURCE_IDS,
  type LiveCommentSourceId,
} from "../../../../server/lib/live-comment-settings.ts";
import type {
  LiveCommentMapping,
  LiveCommentMappingInput,
} from "../../../lib/api/live-comment-settings.ts";
import {
  type ChannelGroup,
  CHANNEL_TYPES,
  channelTypeLabel,
} from "../../../lib/service.ts";
import { commentSourceLabel } from "../../../lib/comment-source.ts";
import Modal from "../../atoms/Modal.tsx";
import Icon from "../../atoms/Icon.tsx";
import ChannelBadge from "../../atoms/ChannelBadge.tsx";
import { t } from "../../../locales/i18n.ts";
import styles from "./MappingFormModal.module.css";

/** フォームが扱う 1 行の割り当て (channelId は未検証の入力値)。 */
type AssignmentRow = { source: LiveCommentSourceId; channelId: string };

type Props = {
  /** 表示状況。 */
  open: boolean;

  /** 編集対象。未指定なら新規登録。 */
  initial?: LiveCommentMapping;

  /** チャンネル選択肢にするチャンネル一覧。 */
  channels: ChannelGroup[];

  /** 既に割り当て済みのチャンネル (選択不可にする。編集対象自身は除く)。 */
  takenChannels: string[];

  /** 保存処理中などで送信を受け付けない状態。 */
  busy?: boolean;

  /** 入力内容で保存する。 */
  onSave: (input: LiveCommentMappingInput) => void;

  /** モーダルを閉じる。 */
  onClose: () => void;
};

/** 空 ID 行を落とし、ID を trim した割り当てにする。 */
function normalize(rows: AssignmentRow[]): AssignmentRow[] {
  return rows
    .map((row) => ({ source: row.source, channelId: row.channelId.trim() }))
    .filter((row) => row.channelId !== "");
}

/** 形式不正の (非空) 行。 */
function invalidRows(rows: AssignmentRow[]): AssignmentRow[] {
  return normalize(rows).filter((row) =>
    !isValidChannelId(row.source, row.channelId)
  );
}

/** 複数行に重複する (取得元, ID)。 */
function duplicateKeys(rows: AssignmentRow[]): string[] {
  const seen = new Set<string>();
  const dup = new Set<string>();
  for (const row of normalize(rows)) {
    if (!isValidChannelId(row.source, row.channelId)) {
      continue;
    }
    const key = `${row.source}:${row.channelId}`;
    if (seen.has(key)) {
      dup.add(row.channelId);
    } else {
      seen.add(key);
    }
  }
  return [...dup];
}

/** 入力値が保存可能か (チャンネル必須・全行が有効・重複なし)。 */
function isValid(value: { channel: string; assignments: AssignmentRow[] }) {
  return value.channel.trim() !== "" &&
    invalidRows(value.assignments).length === 0 &&
    duplicateKeys(value.assignments).length === 0;
}

/**
 * 実況コメント割り当ての登録・編集モーダル。チャンネル (単一選択) を選び、
 * 取得元ごとの実況チャンネル ID を 0 個以上割り当てる。
 *
 * フォーム状態は @tanstack/react-form に集約する (RuleFormModal と同方針)。
 */
export default function MappingFormModal(props: Props) {
  const initial = props.initial;
  const taken = new Set(props.takenChannels);

  const form = useForm({
    defaultValues: {
      channel: initial?.channel ?? "",
      assignments: (initial?.assignments ?? []).map((a) => ({
        source: a.source,
        channelId: a.channelId,
      })) as AssignmentRow[],
    },
    onSubmit: ({ value }) => {
      if (!isValid(value) || props.busy) {
        return;
      }
      props.onSave({
        channel: value.channel.trim(),
        assignments: normalize(value.assignments),
        enabled: initial?.enabled ?? true,
      });
    },
  });

  return (
    <Modal open={props.open} onClose={props.onClose}>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          event.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div className={styles.body}>
          <h2 className={styles.title}>
            {initial
              ? t("liveComment.modal.titleEdit")
              : t("liveComment.modal.titleNew")}
          </h2>
          <p className={styles.lead}>{t("liveComment.modal.lead")}</p>

          <form.Field name="channel">
            {(field) => (
              <div className={styles.field}>
                <div className={styles.fieldHead}>
                  <span className={styles.fieldLabel}>
                    {t("liveComment.modal.channel")}
                  </span>
                  <span className={styles.reqTag}>
                    {t("liveComment.modal.channelRequired")}
                  </span>
                  <span className={styles.fieldHint}>
                    {t("liveComment.modal.channelHint")}
                  </span>
                </div>
                {CHANNEL_TYPES.map((channelType) => {
                  const group = props.channels.filter(
                    (channel) => channel.type === channelType,
                  );
                  if (group.length === 0) {
                    return null;
                  }
                  return (
                    <div key={channelType} className={styles.bandGroup}>
                      <div className={styles.bandLabel}>
                        {channelTypeLabel(channelType)}
                      </div>
                      <div className={styles.channelGrid}>
                        {group.map((channel) => {
                          const isTaken = taken.has(channel.id);
                          return (
                            <button
                              type="button"
                              key={channel.id}
                              disabled={isTaken}
                              className={`${styles.channelOption} ${
                                field.state.value === channel.id
                                  ? styles.channelOn
                                  : ""
                              }`}
                              onClick={() => field.handleChange(channel.id)}
                            >
                              {channel.services[0] && (
                                <ChannelBadge
                                  service={channel.services[0]}
                                  size="xs"
                                />
                              )}
                              <span className={styles.channelName}>
                                {channel.name}
                              </span>
                              {isTaken && (
                                <span className={styles.takenTag}>
                                  {t("liveComment.modal.channelTaken")}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </form.Field>

          <form.Field name="assignments">
            {(field) => {
              const rows = field.state.value;
              const change = (index: number, patch: Partial<AssignmentRow>) =>
                field.handleChange(
                  rows.map((row, i) => i === index ? { ...row, ...patch } : row),
                );
              const add = () =>
                field.handleChange([
                  ...rows,
                  { source: LIVE_COMMENT_SOURCE_IDS[0], channelId: "" },
                ]);
              const removeAt = (index: number) =>
                field.handleChange(rows.filter((_, i) => i !== index));

              const invalidCount = invalidRows(rows).length;
              const duplicates = duplicateKeys(rows);

              return (
                <div className={styles.field}>
                  <div className={styles.fieldHead}>
                    <span className={styles.fieldLabel}>
                      {t("liveComment.modal.assignments")}
                    </span>
                    <span className={styles.optTag}>
                      {t("liveComment.modal.assignmentsOptional")}
                    </span>
                  </div>

                  {rows.length === 0
                    ? (
                      <div className={styles.empty}>
                        {t("liveComment.modal.assignmentsEmpty")}
                      </div>
                    )
                    : (
                      <div className={styles.rows}>
                        {rows.map((row, index) => {
                          const id = row.channelId.trim();
                          const bad = id !== "" &&
                            (!isValidChannelId(row.source, id) ||
                              duplicates.includes(id));
                          return (
                            <div key={index} className={styles.row}>
                              <select
                                className={styles.sourceSelect}
                                value={row.source}
                                aria-label={t("liveComment.modal.sourceLabel")}
                                onChange={(e) =>
                                  change(index, {
                                    source: e.target.value as LiveCommentSourceId,
                                  })}
                              >
                                {LIVE_COMMENT_SOURCE_IDS.map((source) => (
                                  <option key={source} value={source}>
                                    {commentSourceLabel(source)}
                                  </option>
                                ))}
                              </select>
                              <span className={styles.separator}>:</span>
                              <input
                                className={`${styles.idInput} ${
                                  bad ? styles.idBad : ""
                                }`}
                                value={row.channelId}
                                placeholder={t(
                                  `liveComment.modal.idPlaceholder.${row.source}`,
                                )}
                                spellCheck={false}
                                aria-label={t("liveComment.modal.idLabel")}
                                onChange={(e) =>
                                  change(index, { channelId: e.target.value })}
                              />
                              <button
                                type="button"
                                className={styles.rowButton}
                                aria-label={t(
                                  "liveComment.modal.removeAssignment",
                                )}
                                title={t("liveComment.modal.removeAssignment")}
                                onClick={() => removeAt(index)}
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
                    onClick={add}
                  >
                    <Icon size={15}>add</Icon>
                    {t("liveComment.modal.addAssignment")}
                  </button>

                  {invalidCount > 0 && (
                    <p className={styles.fieldError}>
                      {t("liveComment.modal.error.format", {
                        count: invalidCount,
                      })}
                    </p>
                  )}
                  {duplicates.length > 0 && (
                    <p className={styles.fieldError}>
                      {t("liveComment.modal.error.duplicate", {
                        ids: duplicates.join(", "),
                      })}
                    </p>
                  )}
                </div>
              );
            }}
          </form.Field>
        </div>

        <div className={styles.foot}>
          <form.Subscribe selector={(s) => s.values}>
            {(values) => (
              <button
                type="submit"
                className={styles.save}
                disabled={!isValid(values) || props.busy}
              >
                <Icon size={16}>{initial ? "save" : "add"}</Icon>
                {initial
                  ? t("liveComment.modal.saveEdit")
                  : t("liveComment.modal.save")}
              </button>
            )}
          </form.Subscribe>
          <button
            type="button"
            className={styles.cancel}
            onClick={props.onClose}
          >
            {t("liveComment.modal.cancel")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
