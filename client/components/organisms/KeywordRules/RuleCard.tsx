import { useState } from "react";
import type { components } from "../../../lib/api/schema.d.ts";
import type { KeywordRule } from "../../../lib/api/keyword-rules.ts";
import { genreByLv1 } from "../../../lib/genre.ts";
import Icon from "../../atoms/Icon.tsx";
import IconButton from "../../atoms/IconButton.tsx";
import ToggleSwitch from "../../atoms/ToggleSwitch.tsx";
import ChannelBadge from "../../atoms/ChannelBadge.tsx";
import GenreTag from "../../atoms/GenreTag.tsx";
import { t } from "../../../locales/i18n.ts";
import styles from "./RuleCard.module.css";

type Service = components["schemas"]["MirakurunService"];

type Props = {
  /** 表示するルール。 */
  rule: KeywordRule;

  /** チャンネル条件チップの表示に使うサービス一覧。 */
  services: Service[];

  /** 今後 7 日間の一致番組数。 */
  matchCount: number;

  /** 有効/停止を切り替える。 */
  onToggle: () => void;

  /** 編集モーダルを開く。 */
  onEdit: () => void;

  /** ルールを削除する (インライン確認の「削除」確定時)。 */
  onRemove: () => void;

  /** 更新処理中などで操作を受け付けない状態。 */
  disabled?: boolean;
};

/** ISO 日付 (YYYY-MM-DD) を M/D 表記にする。 */
function isoToShort(iso: string): string {
  const [, month, day] = iso.split("-").map(Number);
  return `${month}/${day}`;
}

function periodLabel(rule: KeywordRule): string | null {
  if (rule.from !== undefined && rule.to !== undefined) {
    return t("keyword.card.periodRange", {
      from: isoToShort(rule.from),
      to: isoToShort(rule.to),
    });
  }
  if (rule.from !== undefined) {
    return t("keyword.card.periodFrom", { from: isoToShort(rule.from) });
  }
  if (rule.to !== undefined) {
    return t("keyword.card.periodTo", { to: isoToShort(rule.to) });
  }
  return null;
}

/** 条件チップ列。期間 → チャンネル → ジャンルの順、条件なしは案内文。 */
function ConditionChips({ rule, services }: Pick<Props, "rule" | "services">) {
  const period = periodLabel(rule);
  const channels = rule.serviceIds
    .map((id) => services.find((service) => service.id === id))
    .filter((service): service is Service => service !== undefined);
  // 同じキーに丸まる lv1 (12..15 → other) を重複表示しない。
  const genreKeys = [...new Set(rule.genres.map((lv1) => genreByLv1(lv1).key))];

  if (
    period === null && rule.serviceIds.length === 0 && genreKeys.length === 0
  ) {
    return (
      <span className={styles.condNone}>{t("keyword.card.conditionNone")}</span>
    );
  }

  return (
    <>
      {period !== null && (
        <span className={styles.chip}>
          <Icon size={12}>calendar_month</Icon>
          <span className={styles.mono}>{period}</span>
        </span>
      )}
      {rule.serviceIds.length > 0 && (
        <span className={styles.chip}>
          {channels.slice(0, 3).map((service) => (
            <ChannelBadge key={service.id} service={service} size="xs" />
          ))}
          <span>
            {rule.serviceIds.length === 1
              ? channels[0]?.name ?? ""
              : t("keyword.card.channels", { count: rule.serviceIds.length })}
          </span>
        </span>
      )}
      {genreKeys.map((key) => <GenreTag key={key} genreKey={key} />)}
    </>
  );
}

/**
 * キーワード自動録画ルールのカード。有効/停止トグル・条件チップ・一致件数・
 * 編集・削除 (インライン確認) を持つ。
 */
export default function RuleCard(props: Props) {
  const [confirming, setConfirming] = useState(false);
  const rule = props.rule;

  return (
    <div
      className={`${styles.card} ${rule.enabled ? "" : styles.off}`}
      onMouseLeave={() => setConfirming(false)}
    >
      <ToggleSwitch
        checked={rule.enabled}
        label={t(
          rule.enabled ? "keyword.card.disable" : "keyword.card.enable",
          { keyword: rule.keyword },
        )}
        className={styles.sw}
        disabled={props.disabled}
        onToggle={props.onToggle}
      />

      <div className={styles.main}>
        <div className={styles.top}>
          <span className={styles.keyword}>「{rule.keyword}」</span>
          {!rule.enabled && (
            <span className={styles.offPill}>{t("keyword.card.off")}</span>
          )}
          {rule.enabled && (
            <span
              className={`${styles.matchPill} ${
                props.matchCount === 0 ? styles.matchZero : ""
              }`}
            >
              {t("keyword.card.matches", { count: props.matchCount })}
            </span>
          )}
        </div>
        <div className={styles.conds}>
          <ConditionChips rule={rule} services={props.services} />
        </div>
      </div>

      <div className={styles.actions}>
        {confirming
          ? (
            <div className={styles.confirm}>
              <span className={styles.confirmText}>
                {t("keyword.card.confirm")}
              </span>
              <button
                type="button"
                className={styles.confirmRemove}
                disabled={props.disabled}
                onClick={props.onRemove}
              >
                {t("keyword.card.confirmRemove")}
              </button>
              <button
                type="button"
                className={styles.confirmCancel}
                onClick={() => setConfirming(false)}
              >
                {t("keyword.card.confirmCancel")}
              </button>
            </div>
          )
          : (
            <>
              <IconButton
                icon="edit"
                size={15}
                label={t("keyword.card.edit")}
                disabled={props.disabled}
                onClick={props.onEdit}
              />
              <IconButton
                icon="delete"
                size={15}
                label={t("keyword.card.remove")}
                className={styles.danger}
                disabled={props.disabled}
                onClick={() => setConfirming(true)}
              />
            </>
          )}
      </div>
    </div>
  );
}
