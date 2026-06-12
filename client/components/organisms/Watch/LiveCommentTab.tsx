import { type FormEvent, useState } from "react";
import type { LiveComment } from "../../../lib/live-comment.ts";
import { t } from "../../../locales/i18n.ts";
import CommentFeed from "./CommentFeed.tsx";
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
 * 実況コメントタブ。上が feed (CommentFeed: 自動スクロール + 最新へボタン)、
 * 下が入力欄 (onPost があるときのみ)。未接続かつコメント空のときは
 * ダミーを流さず中立的な案内のみ表示する。
 */
export default function LiveCommentTab({ comments, connected, onPost }: Props) {
  const [draft, setDraft] = useState("");

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = draft.trim();
    if (!value || onPost === undefined) {
      return;
    }
    onPost(value);
    setDraft("");
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
        : <CommentFeed comments={comments} />}
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
