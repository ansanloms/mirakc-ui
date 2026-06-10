import { type FormEvent, useMemo, useState } from "react";
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

/**
 * キーワード自動録画ルールの登録・編集モーダル。キーワード (必須)・期間・
 * チャンネル・ジャンルを入力し、条件に一致する番組のライブプレビューを出す。
 * 一致判定は録画ジョブと同じ matchesKeywordRule を使う。
 */
export default function RuleFormModal(props: Props) {
  const initial = props.initial;
  const [keyword, setKeyword] = useState(initial?.keyword ?? "");
  const [from, setFrom] = useState(initial?.from ?? "");
  const [to, setTo] = useState(initial?.to ?? "");
  const [serviceIds, setServiceIds] = useState<number[]>(
    initial?.serviceIds ?? [],
  );
  const [genres, setGenres] = useState<number[]>(initial?.genres ?? []);

  const normalized = keyword.trim();
  const periodBad = from !== "" && to !== "" && from > to;
  const valid = normalized !== "" && !periodBad;

  const draft = useMemo(() => ({
    keyword: normalized,
    from: from === "" ? undefined : from,
    to: to === "" ? undefined : to,
    serviceIds,
    genres,
  }), [normalized, from, to, serviceIds, genres]);

  const matches = useMemo(() => {
    if (normalized === "") {
      return [];
    }
    return props.upcoming.filter((entry) =>
      matchesKeywordRule(draft, entry.target)
    );
  }, [draft, normalized, props.upcoming]);

  const toggleService = (id: number) => {
    setServiceIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const toggleGenre = (lv1: number) => {
    setGenres((prev) =>
      prev.includes(lv1) ? prev.filter((x) => x !== lv1) : [...prev, lv1]
    );
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!valid || props.busy) {
      return;
    }
    props.onSave({
      ...draft,
      enabled: initial?.enabled ?? true,
    });
  };

  return (
    <Modal open={props.open} onClose={props.onClose}>
      {
        /* 縦に長いフォームのため、本文のみスクロールしフッターは固定する
          (atoms/Modal は overflow を子に委ねる)。 */
      }
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.body}>
          <h2 className={styles.title}>
            {initial
              ? t("keyword.modal.titleEdit")
              : t("keyword.modal.titleNew")}
          </h2>
          <p className={styles.lead}>{t("keyword.modal.lead")}</p>

          <div className={styles.field}>
            <div className={styles.fieldHead}>
              <span className={styles.fieldLabel}>
                {t("keyword.modal.keyword")}
              </span>
            </div>
            <input
              type="text"
              className={styles.keywordInput}
              value={keyword}
              placeholder={t("keyword.modal.keywordPlaceholder")}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>

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
                    setFrom("");
                    setTo("");
                  }}
                >
                  {t("keyword.modal.clear")}
                </button>
              )}
            </div>
            <div className={styles.periodRow}>
              <input
                type="date"
                className={styles.dateInput}
                value={from}
                aria-label={t("keyword.modal.from")}
                onChange={(event) => setFrom(event.target.value)}
              />
              <span className={styles.periodSep}>
                {t("keyword.modal.periodSep")}
              </span>
              <input
                type="date"
                className={styles.dateInput}
                value={to}
                aria-label={t("keyword.modal.to")}
                onChange={(event) => setTo(event.target.value)}
              />
            </div>
            {periodBad && (
              <p className={styles.periodError}>
                {t("keyword.modal.periodError")}
              </p>
            )}
          </div>

          <div className={styles.field}>
            <div className={styles.fieldHead}>
              <span className={styles.fieldLabel}>
                {t("keyword.modal.channels")}
              </span>
              <span className={styles.optTag}>
                {t("keyword.modal.optionalMulti")}
              </span>
              {serviceIds.length > 0
                ? (
                  <button
                    type="button"
                    className={styles.fieldClear}
                    onClick={() => setServiceIds([])}
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
                          serviceIds.includes(service.id)
                            ? styles.channelOn
                            : ""
                        }`}
                        onClick={() => toggleService(service.id)}
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

          <div className={styles.field}>
            <div className={styles.fieldHead}>
              <span className={styles.fieldLabel}>
                {t("keyword.modal.genres")}
              </span>
              <span className={styles.optTag}>
                {t("keyword.modal.optionalMulti")}
              </span>
              {genres.length > 0
                ? (
                  <button
                    type="button"
                    className={styles.fieldClear}
                    onClick={() => setGenres([])}
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
                const on = genres.includes(genre.lv1);
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
                    onClick={() => toggleGenre(genre.lv1)}
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
                  : t("keyword.modal.preview.count", { count: matches.length })}
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
                    <li key={entry.program.id} className={styles.previewRow}>
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
        </div>

        <div className={styles.foot}>
          <button
            type="submit"
            className={styles.save}
            disabled={!valid || props.busy}
          >
            <Icon size={16}>add</Icon>
            {initial ? t("keyword.modal.saveEdit") : t("keyword.modal.save")}
          </button>
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
