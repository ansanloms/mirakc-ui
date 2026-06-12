import { type FormEvent, useEffect, useRef, useState } from "react";
import type { LiveComment } from "../../../lib/live-comment.ts";
import { t } from "../../../locales/i18n.ts";
import Comment from "../../molecules/Watch/Comment.tsx";
import Icon from "../../atoms/Icon.tsx";
import styles from "./LiveCommentTab.module.css";

type Props = {
  /** 表示するコメント列 (古い順)。 */
  comments: LiveComment[];
  /** 実況ソースに接続済みか。 */
  connected: boolean;
  /** ユーザ投稿。未対応 (現状のニコ生受信専用構成) なら省略し、入力欄ごと隠す。 */
  onPost?: (text: string) => void;
};

/**
 * 実況コメントタブ。上が feed (新着で最下部に自動スクロール、ユーザが上に
 * スクロール中は追従しない)、下が入力欄 (onPost があるときのみ)。未接続かつ
 * コメント空のときはダミーを流さず中立的な案内のみ表示する。
 */
export default function LiveCommentTab({ comments, connected, onPost }: Props) {
  const feedRef = useRef<HTMLDivElement>(null);
  // 最下部付近に居るときだけ自動スクロールで追従する (stick 判定)。
  const stick = useRef(true);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const el = feedRef.current;
    if (el && stick.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [comments]);

  const onScroll = () => {
    const el = feedRef.current;
    if (el) {
      stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    }
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = draft.trim();
    if (!value || onPost === undefined) {
      return;
    }
    onPost(value);
    setDraft("");
    stick.current = true;
  };

  const empty = !connected && comments.length === 0;

  return (
    <div className={styles.tab}>
      {empty
        ? (
          <div className={styles.disconnected}>
            {t("watch.live.disconnected")}
          </div>
        )
        : (
          <div className={styles.feed} ref={feedRef} onScroll={onScroll}>
            {comments.map((comment) => (
              <Comment key={comment.id} comment={comment} />
            ))}
          </div>
        )}
      {onPost !== undefined && (
        <form className={styles.input} onSubmit={submit}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("watch.live.placeholder")}
            maxLength={80}
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label={t("watch.live.send")}
          >
            <Icon size={19}>send</Icon>
          </button>
        </form>
      )}
    </div>
  );
}
