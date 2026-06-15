import { useState } from "react";
import type { LiveCommentMapping } from "../../../lib/api/live-comment-settings.ts";
import type { ChannelGroup } from "../../../lib/service.ts";
import {
  COMMENT_SOURCE_COLOR,
  COMMENT_SOURCE_ORDER,
  commentSourceLabel,
} from "../../../lib/comment-source.ts";
import IconButton from "../../atoms/IconButton.tsx";
import ToggleSwitch from "../../atoms/ToggleSwitch.tsx";
import ChannelBadge from "../../atoms/ChannelBadge.tsx";
import { t } from "../../../locales/i18n.ts";
import styles from "./MappingCard.module.css";

type Props = {
  /** 表示する割り当て。 */
  mapping: LiveCommentMapping;

  /** mapping.channel に対応するチャンネル (バッジ・チャンネル名の表示に使う)。 */
  channel?: ChannelGroup;

  /** 有効/停止を切り替える。 */
  onToggle: () => void;

  /** 編集モーダルを開く。 */
  onEdit: () => void;

  /** 割り当てを削除する (インライン確認の「削除」確定時)。 */
  onRemove: () => void;

  /** 更新処理中などで操作を受け付けない状態。 */
  disabled?: boolean;
};

/**
 * 実況コメント割り当てのカード。チャンネル (バッジ + 名前)・有効/停止トグル・
 * 取得元ごとの実況チャンネル ID チップ・編集・削除 (インライン確認) を持つ。
 * RuleCard (キーワード録画) と同じレイアウト。
 */
export default function MappingCard(props: Props) {
  const [confirming, setConfirming] = useState(false);
  const mapping = props.mapping;
  const service = props.channel?.services[0];
  const channelName = props.channel?.name ?? mapping.channel;

  // 取得元の表示順に並べる (保存順に依存しない安定表示)。
  const assignments = [...mapping.assignments].sort((a, b) =>
    COMMENT_SOURCE_ORDER.indexOf(a.source) -
    COMMENT_SOURCE_ORDER.indexOf(b.source)
  );

  return (
    <div
      className={`${styles.card} ${mapping.enabled ? "" : styles.off}`}
      onMouseLeave={() => setConfirming(false)}
    >
      <ToggleSwitch
        checked={mapping.enabled}
        label={t(
          mapping.enabled ? "liveComment.card.disable" : "liveComment.card.enable",
          { channel: channelName },
        )}
        className={styles.sw}
        disabled={props.disabled}
        onToggle={props.onToggle}
      />

      <div className={styles.main}>
        <div className={styles.top}>
          {service && <ChannelBadge service={service} size="xs" />}
          <span className={styles.channel}>{channelName}</span>
          {!mapping.enabled && (
            <span className={styles.offPill}>{t("liveComment.card.off")}</span>
          )}
        </div>
        <div className={styles.conds}>
          {assignments.length === 0
            ? (
              <span className={styles.condNone}>
                {t("liveComment.card.noAssignments")}
              </span>
            )
            : (
              assignments.map((assignment) => (
                <span
                  key={`${assignment.source}:${assignment.channelId}`}
                  className={styles.chip}
                >
                  <span
                    className={styles.dot}
                    style={{ background: COMMENT_SOURCE_COLOR[assignment.source] }}
                  />
                  {commentSourceLabel(assignment.source)}
                  <span className={styles.mono}>{assignment.channelId}</span>
                </span>
              ))
            )}
        </div>
      </div>

      <div className={styles.actions}>
        {confirming
          ? (
            <div className={styles.confirm}>
              <span className={styles.confirmText}>
                {t("liveComment.card.confirm")}
              </span>
              <button
                type="button"
                className={styles.confirmRemove}
                disabled={props.disabled}
                onClick={props.onRemove}
              >
                {t("liveComment.card.confirmRemove")}
              </button>
              <button
                type="button"
                className={styles.confirmCancel}
                onClick={() => setConfirming(false)}
              >
                {t("liveComment.card.confirmCancel")}
              </button>
            </div>
          )
          : (
            <>
              <IconButton
                icon="edit"
                size={15}
                label={t("liveComment.card.edit")}
                disabled={props.disabled}
                onClick={props.onEdit}
              />
              <IconButton
                icon="delete"
                size={15}
                label={t("liveComment.card.remove")}
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
