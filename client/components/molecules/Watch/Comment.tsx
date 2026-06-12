import type { LiveComment } from "../../../lib/live-comment.ts";
import styles from "./Comment.module.css";

type Props = {
  /** 表示する実況コメント 1 件。 */
  comment: LiveComment;

  /** 映像上のオーバーレイ表示 (白文字 + 影。プレイヤーのコメント表示用)。 */
  onVideo?: boolean;
};

/**
 * 実況コメント 1 行。時刻列と本文領域 (投稿者名 + 本文) の 2 カラム grid で、
 * 本文が長くても折り返しは本文領域の中に収まる。投稿者名 (hue 色) は匿名なら
 * 出さない。自分の投稿は強調背景。
 */
export default function Comment({ comment, onVideo = false }: Props) {
  const classNames = [
    styles.comment,
    comment.me ? styles.me : "",
    onVideo ? styles.onVideo : "",
  ].filter((name) => name !== "").join(" ");
  return (
    <div className={classNames}>
      <span className={styles.time}>{comment.time}</span>
      <span className={styles.body}>
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
