import type { CSSProperties } from "react";
import type { LiveComment } from "../../../lib/live-comment.ts";
import {
  COMMENT_SOURCE_COLOR,
  commentSourceTag,
} from "../../../lib/comment-source.ts";
import styles from "./Comment.module.css";

type Props = {
  /** 表示する実況コメント 1 件。 */
  comment: LiveComment;

  /** 映像上のオーバーレイ表示 (白文字 + 影。プレイヤーのコメント表示用)。 */
  onVideo?: boolean;

  /** 取得元バッジを表示する (取得元が複数あるとき)。 */
  showSource?: boolean;
};

/**
 * 実況コメント 1 行。時刻列と本文領域 (取得元バッジ + 投稿者名 + 本文) の
 * 2 カラム grid で、本文が長くても折り返しは本文領域の中に収まる。取得元
 * バッジは複数取得元のときのみ、投稿者名 (hue 色) は匿名なら出さない。
 * 自分の投稿は強調背景。
 */
export default function Comment(
  { comment, onVideo = false, showSource = false }: Props,
) {
  const classNames = [
    styles.comment,
    comment.me ? styles.me : "",
    onVideo ? styles.onVideo : "",
  ].filter((name) => name !== "").join(" ");
  return (
    <div className={classNames}>
      <span className={styles.time}>{comment.time}</span>
      <span className={styles.body}>
        {showSource && (
          <span
            className={styles.source}
            style={{
              ["--source-color"]: COMMENT_SOURCE_COLOR[comment.source],
            } as CSSProperties}
          >
            {commentSourceTag(comment.source)}
          </span>
        )}
        {comment.name !== "" && (
          <span
            className={styles.name}
            style={{ color: `oklch(0.62 0.16 ${comment.colorHue})` }}
          >
            {comment.name}
          </span>
        )}
        <span className={styles.text}>{comment.text}</span>
      </span>
    </div>
  );
}
