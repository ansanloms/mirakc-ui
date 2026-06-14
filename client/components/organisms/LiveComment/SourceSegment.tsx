import { type LiveCommentSourceId } from "../../../../server/lib/live-comment-settings.ts";
import { commentSourceLabel } from "../../../lib/comment-source.ts";
import Icon from "../../atoms/Icon.tsx";
import { t } from "../../../locales/i18n.ts";
import styles from "./SourceSegment.module.css";

type Props = {
  /** 選択肢の取得元 (表示順)。 */
  sources: LiveCommentSourceId[];

  /** 編集対象として選択中の取得元。 */
  selected: LiveCommentSourceId;

  onSelect: (id: LiveCommentSourceId) => void;
};

/**
 * コメント取得元の選択カード (design .set-card + .seg)。セグメントで編集
 * 対象の取得元を切り替える。選択中の取得元の説明文を下に表示する。
 * 割り当ては取得元ごとに別々に保持される (切替でドラフトを失わない)。
 */
export default function SourceSegment(props: Props) {
  return (
    <section className={styles.card}>
      <div className={styles.head}>
        <span className={styles.headIcon}>
          <Icon size={20}>rss_feed</Icon>
        </span>
        <div>
          <h2 className={styles.title}>{t("liveComment.source.title")}</h2>
          <p className={styles.description}>
            {t("liveComment.source.description")}
          </p>
        </div>
      </div>

      <div className={styles.body}>
        <div
          className={styles.segment}
          role="tablist"
          aria-label={t("liveComment.source.title")}
        >
          {props.sources.map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={props.selected === id}
              className={`${styles.segButton} ${
                props.selected === id ? styles.segOn : ""
              }`}
              onClick={() => props.onSelect(id)}
            >
              <span className={styles.segDot} />
              {commentSourceLabel(id)}
            </button>
          ))}
        </div>
        <p className={styles.note}>
          {t(`liveComment.source.${props.selected}.note`)}
        </p>
      </div>
    </section>
  );
}
