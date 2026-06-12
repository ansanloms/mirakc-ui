import { useEffect, useRef, useState } from "react";
import type { LiveComment } from "../../../lib/live-comment.ts";
import { t } from "../../../locales/i18n.ts";
import Comment from "../../molecules/Watch/Comment.tsx";
import Icon from "../../atoms/Icon.tsx";
import styles from "./CommentFeed.module.css";

type Props = {
  /** 表示するコメント列 (古い順)。 */
  comments: LiveComment[];

  /** 映像上のオーバーレイ表示 (プレイヤーのコメント表示用)。 */
  onVideo?: boolean;
};

/**
 * 実況コメントの feed。新着で最下部に自動スクロールし、ユーザが上に
 * スクロール中は追従を止めて「最新のコメントへ」ボタンを出す
 * (design .feed-wrap + .jump-btn)。実況タブとプレイヤーのコメント
 * オーバーレイの両方から使う。
 *
 * onVideo (プレイヤー内) ではユーザスクロールを想定しない:
 * スクロールバーも「最新のコメントへ」ボタンも出さず、常に最新へ追従する。
 */
export default function CommentFeed({ comments, onVideo = false }: Props) {
  const feedRef = useRef<HTMLDivElement>(null);
  // 最下部付近に居るときだけ自動スクロールで追従する (stick 判定)。
  const stick = useRef(true);
  const [away, setAway] = useState(false);

  useEffect(() => {
    const el = feedRef.current;
    if (el && (onVideo || stick.current)) {
      el.scrollTop = el.scrollHeight;
      setAway(false);
    }
  }, [comments, onVideo]);

  const onScroll = () => {
    const el = feedRef.current;
    if (el) {
      const stuck = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
      stick.current = stuck;
      setAway(!stuck);
    }
  };

  const jump = () => {
    const el = feedRef.current;
    stick.current = true;
    setAway(false);
    if (el) {
      if (typeof el.scrollTo === "function") {
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
      } else {
        el.scrollTop = el.scrollHeight;
      }
    }
  };

  return (
    <div
      className={`${styles.feedWrap} ${onVideo ? styles.onVideo : ""}`}
    >
      <div
        className={styles.feed}
        ref={feedRef}
        onScroll={onVideo ? undefined : onScroll}
      >
        {comments.map((comment) => (
          <Comment key={comment.id} comment={comment} onVideo={onVideo} />
        ))}
      </div>
      {!onVideo && (
        <button
          type="button"
          className={`${styles.jumpBtn} ${away ? styles.show : ""}`}
          onClick={jump}
          aria-label={t("watch.live.jumpToLatest")}
        >
          <Icon size={19}>arrow_downward</Icon>
        </button>
      )}
    </div>
  );
}
