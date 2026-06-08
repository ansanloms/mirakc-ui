import type { LiveComment } from "../../../lib/live-comment.ts";
import styles from "./Comment.module.css";

type Props = {
  /** 表示する実況コメント 1 件。 */
  comment: LiveComment;
};

/** 実況コメント 1 行。時刻・投稿者名 (hue 色) ・本文。自分の投稿は強調背景。 */
export default function Comment({ comment }: Props) {
  return (
    <div className={`${styles.comment} ${comment.me ? styles.me : ""}`}>
      <span className={styles.time}>{comment.time}</span>
      <span
        className={styles.name}
        style={{ color: `oklch(0.62 0.16 ${comment.colorHue})` }}
      >
        {comment.name}
      </span>
      <span className={styles.text}>{comment.text}</span>
    </div>
  );
}
