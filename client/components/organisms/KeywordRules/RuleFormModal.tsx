import { useForm } from "@tanstack/react-form";
import type { components } from "../../../lib/api/schema.d.ts";
import {
  type KeywordRule,
  type KeywordRuleInput,
  matchesKeywordRule,
} from "../../../../server/lib/keyword-rules.ts";
import type { UpcomingProgram } from "../../../lib/keyword-preview.ts";
import { GENRES, genreVars } from "../../../lib/genre.ts";
import { CHANNEL_TYPES, channelTypeLabel } from "../../../lib/service.ts";
import { formatHm, formatMd, formatWeekday } from "../../../lib/datetime.ts";
import Modal from "../../atoms/Modal.tsx";
import Icon from "../../atoms/Icon.tsx";
import ChannelBadge from "../../atoms/ChannelBadge.tsx";
import { t } from "../../../locales/i18n.ts";
import styles from "./RuleFormModal.module.css";

type Service = components["schemas"]["MirakurunService"];

type Props = {
  /** 表示状況。 */
  open: boolean;

  /** 編集対象。未指定なら新規登録。 */
  initial?: KeywordRule;

  /** チャンネル選択肢にするサービス一覧。 */
  services: Service[];

  /** 一致プレビューの対象 (今後 7 日間の番組)。 */
  upcoming: UpcomingProgram[];

  /** 保存処理中などで送信を受け付けない状態。 */
  busy?: boolean;

  /** 入力内容で保存する。 */
  onSave: (input: KeywordRuleInput) => void;

  /** モーダルを閉じる。 */
  onClose: () => void;
};

const PREVIEW_LIMIT = 5;

/** 入力値が保存可能か (キーワード必須・期間の前後関係)。 */
function isValid(
  value: { keyword: string; from: string; to: string },
): boolean {
  const normalized = value.keyword.trim();
  const periodBad = value.from !== "" && value.to !== "" &&
    value.from > value.to;
  return normalized !== "" && !periodBad;
}

/**
 * キーワード自動録画ルールの登録・編集モーダル。キーワード (必須)・期間・
 * チャンネル・ジャンルを入力し、条件に一致する番組のライブプレビューを出す。
 * 一致判定は録画ジョブと同じ matchesKeywordRule を使う。
 *
 * フォーム状態は @tanstack/react-form の useForm に集約する。各入力は
 * form.Field で value/onChange をバインドし、プレビュー・保存可否などの
 * 派生状態は form.Subscribe で values を購読して導出する。
 */
export default function RuleFormModal(props: Props) {
  const initial = props.initial;

  const form = useForm({
    defaultValues: {
      keyword: initial?.keyword ?? "",
      from: initial?.from ?? "",
      to: initial?.to ?? "",
      serviceIds: (initial?.serviceIds ?? []) as number[],
      genres: (initial?.genres ?? []) as number[],
    },
    onSubmit: ({ value }) => {
      if (!isValid(value) || props.busy) {
        return;
      }
      props.onSave({
        keyword: value.keyword.trim(),
        from: value.from === "" ? undefined : value.from,
        to: value.to === "" ? undefined : value.to,
        serviceIds: value.serviceIds,
        genres: value.genres,
        enabled: initial?.enabled ?? true,
      });
    },
  });

  return (
    <Modal open={props.open} onClose={props.onClose}>
      {
        /* 縦に長いフォームのため、本文のみスクロールしフッターは固定する
          (atoms/Modal は overflow を子に委ねる)。 */
      }
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
              ? t("keyword.modal.titleEdit")
              : t("keyword.modal.titleNew")}
          </h2>
          <p className={styles.lead}>{t("keyword.modal.lead")}</p>

          <form.Field name="keyword">
            {(field) => (
              <div className={styles.field}>
                <div className={styles.fieldHead}>
                  <span className={styles.fieldLabel}>
                    {t("keyword.modal.keyword")}
                  </span>
                </div>
                <input
                  type="text"
                  className={styles.keywordInput}
                  value={field.state.value}
                  placeholder={t("keyword.modal.keywordPlaceholder")}
                  onChange={(event) => field.handleChange(event.target.value)}
                />
              </div>
            )}
          </form.Field>

          <form.Subscribe
            selector={(s) => [s.values.from, s.values.to] as const}
          >
            {([from, to]) => {
              const periodBad = from !== "" && to !== "" && from > to;
              return (
                <div className={styles.field}>
                  <div className={styles.fieldHead}>
                    <span className={styles.fieldLabel}>
                      {t("keyword.modal.period")}
                    </span>
                    <span className={styles.optTag}>
                      {t("keyword.modal.optional")}
                    </span>
                    {(from !== "" || to !== "") && (
                      <button
                        type="button"
                        className={styles.fieldClear}
                        onClick={() => {
                          form.setFieldValue("from", "");
                          form.setFieldValue("to", "");
                        }}
                      >
                        {t("keyword.modal.clear")}
                      </button>
                    )}
                  </div>
                  <div className={styles.periodRow}>
                    <form.Field name="from">
                      {(field) => (
                        <input
                          type="date"
                          className={styles.dateInput}
                          value={field.state.value}
                          aria-label={t("keyword.modal.from")}
                          onChange={(event) =>
                            field.handleChange(event.target.value)}
                        />
                      )}
                    </form.Field>
                    <span className={styles.periodSep}>
                      {t("keyword.modal.periodSep")}
                    </span>
                    <form.Field name="to">
                      {(field) => (
                        <input
                          type="date"
                          className={styles.dateInput}
                          value={field.state.value}
                          aria-label={t("keyword.modal.to")}
                          onChange={(event) =>
                            field.handleChange(event.target.value)}
                        />
                      )}
                    </form.Field>
                  </div>
                  {periodBad && (
                    <p className={styles.periodError}>
                      {t("keyword.modal.periodError")}
                    </p>
                  )}
                </div>
              );
            }}
          </form.Subscribe>

          <form.Field name="serviceIds">
            {(field) => {
              const selected = field.state.value;
              const toggle = (id: number) =>
                field.handleChange(
                  selected.includes(id)
                    ? selected.filter((x) => x !== id)
                    : [...selected, id],
                );
              return (
                <div className={styles.field}>
                  <div className={styles.fieldHead}>
                    <span className={styles.fieldLabel}>
                      {t("keyword.modal.channels")}
                    </span>
                    <span className={styles.optTag}>
                      {t("keyword.modal.optionalMulti")}
                    </span>
                    {selected.length > 0
                      ? (
                        <button
                          type="button"
                          className={styles.fieldClear}
                          onClick={() => field.handleChange([])}
                        >
                          {t("keyword.modal.clearSelection")}
                        </button>
                      )
                      : (
                        <span className={styles.fieldHint}>
                          {t("keyword.modal.channelsHint")}
                        </span>
                      )}
                  </div>
                  {CHANNEL_TYPES.map((channelType) => {
                    const group = props.services.filter(
                      (service) => service.channel.type === channelType,
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
                          {group.map((service) => (
                            <button
                              type="button"
                              key={service.id}
                              className={`${styles.channelOption} ${
                                selected.includes(service.id)
                                  ? styles.channelOn
                                  : ""
                              }`}
                              onClick={() => toggle(service.id)}
                            >
                              <ChannelBadge service={service} size="xs" />
                              <span className={styles.channelName}>
                                {service.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }}
          </form.Field>

          <form.Field name="genres">
            {(field) => {
              const selected = field.state.value;
              const toggle = (lv1: number) =>
                field.handleChange(
                  selected.includes(lv1)
                    ? selected.filter((x) => x !== lv1)
                    : [...selected, lv1],
                );
              return (
                <div className={styles.field}>
                  <div className={styles.fieldHead}>
                    <span className={styles.fieldLabel}>
                      {t("keyword.modal.genres")}
                    </span>
                    <span className={styles.optTag}>
                      {t("keyword.modal.optionalMulti")}
                    </span>
                    {selected.length > 0
                      ? (
                        <button
                          type="button"
                          className={styles.fieldClear}
                          onClick={() => field.handleChange([])}
                        >
                          {t("keyword.modal.clearSelection")}
                        </button>
                      )
                      : (
                        <span className={styles.fieldHint}>
                          {t("keyword.modal.genresHint")}
                        </span>
                      )}
                  </div>
                  <div className={styles.genrePick}>
                    {GENRES.map((genre) => {
                      const on = selected.includes(genre.lv1);
                      const v = genreVars(genre.key);
                      return (
                        <button
                          type="button"
                          key={genre.lv1}
                          className={styles.genreChip}
                          style={on
                            ? {
                              background: v.fill,
                              color: v.ink,
                              borderColor: v.strong,
                            }
                            : undefined}
                          onClick={() => toggle(genre.lv1)}
                        >
                          <span
                            className={styles.genreDot}
                            style={{ background: v.strong }}
                          />
                          {t(`genre.${genre.key}`)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            }}
          </form.Field>

          <form.Subscribe selector={(s) => s.values}>
            {(values) => {
              const normalized = values.keyword.trim();
              const draft = {
                keyword: normalized,
                from: values.from === "" ? undefined : values.from,
                to: values.to === "" ? undefined : values.to,
                serviceIds: values.serviceIds,
                genres: values.genres,
              };
              const matches = normalized === ""
                ? []
                : props.upcoming.filter((entry) =>
                  matchesKeywordRule(draft, entry.target)
                );
              return (
                <div className={styles.preview}>
                  <div className={styles.previewHead}>
                    <Icon size={14}>search</Icon>
                    <span>{t("keyword.modal.preview.title")}</span>
                    <span
                      className={`${styles.previewCount} ${
                        matches.length === 0 ? styles.previewZero : ""
                      }`}
                    >
                      {normalized === ""
                        ? "—"
                        : t("keyword.modal.preview.count", {
                          count: matches.length,
                        })}
                    </span>
                  </div>
                  {normalized === ""
                    ? (
                      <div className={styles.previewEmpty}>
                        {t("keyword.modal.preview.noKeyword")}
                      </div>
                    )
                    : matches.length === 0
                    ? (
                      <div className={styles.previewEmpty}>
                        {t("keyword.modal.preview.noMatch")}
                      </div>
                    )
                    : (
                      <ul className={styles.previewList}>
                        {matches.slice(0, PREVIEW_LIMIT).map((entry) => (
                          <li
                            key={entry.program.id}
                            className={styles.previewRow}
                          >
                            <span className={styles.previewWhen}>
                              {formatMd(entry.program.startAt)}({formatWeekday(
                                entry.program.startAt,
                              )}) {formatHm(entry.program.startAt)}
                            </span>
                            {entry.service && (
                              <ChannelBadge service={entry.service} size="xs" />
                            )}
                            <span className={styles.previewTitle}>
                              {entry.program.name}
                            </span>
                          </li>
                        ))}
                        {matches.length > PREVIEW_LIMIT && (
                          <li className={styles.previewMore}>
                            {t("keyword.modal.preview.more", {
                              count: matches.length - PREVIEW_LIMIT,
                            })}
                          </li>
                        )}
                      </ul>
                    )}
                </div>
              );
            }}
          </form.Subscribe>
        </div>

        <div className={styles.foot}>
          <form.Subscribe selector={(s) => s.values}>
            {(values) => (
              <button
                type="submit"
                className={styles.save}
                disabled={!isValid(values) || props.busy}
              >
                <Icon size={16}>add</Icon>
                {initial
                  ? t("keyword.modal.saveEdit")
                  : t("keyword.modal.save")}
              </button>
            )}
          </form.Subscribe>
          <button
            type="button"
            className={styles.cancel}
            onClick={props.onClose}
          >
            {t("keyword.modal.cancel")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
