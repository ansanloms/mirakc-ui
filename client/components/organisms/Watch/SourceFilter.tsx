import type { CSSProperties } from "react";
import type { CommentSourceId } from "../../../../server/lib/comments/types.ts";
import {
  COMMENT_SOURCE_COLOR,
  commentSourceLabel,
} from "../../../lib/comment-source.ts";
import { t } from "../../../locales/i18n.ts";
import styles from "./SourceFilter.module.css";

type Props = {
  /** 候補の取得元 (表示順)。 */
  sources: CommentSourceId[];

  /** 表示中の取得元。 */
  selected: CommentSourceId[];

  onToggle: (id: CommentSourceId) => void;
};

/**
 * コメント取得元フィルタ (design .src-filter)。取得元チップ (色ドット付き)
 * を複数選択する。候補が 1 つ以下なら出さない (選ぶ意味が無いため)。
 */
export default function SourceFilter({ sources, selected, onToggle }: Props) {
  if (sources.length < 2) {
    return null;
  }
  return (
    <div className={styles.filter}>
      <span className={styles.label}>{t("liveComment.filter.label")}</span>
      {sources.map((id) => {
        const on = selected.includes(id);
        return (
          <button
            key={id}
            type="button"
            className={`${styles.chip} ${on ? styles.on : ""}`}
            style={{
              ["--source-color"]: COMMENT_SOURCE_COLOR[id],
            } as CSSProperties}
            onClick={() => onToggle(id)}
            aria-pressed={on}
          >
            <span className={styles.dot} />
            {commentSourceLabel(id)}
          </button>
        );
      })}
    </div>
  );
}
