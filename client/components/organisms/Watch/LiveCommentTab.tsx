import { type FormEvent, useState } from "react";
import type { LiveComment } from "../../../lib/live-comment.ts";
import type { CommentSourceId } from "../../../../server/lib/comments/types.ts";
import { t } from "../../../locales/i18n.ts";
import CommentFeed from "./CommentFeed.tsx";
import Icon from "../../atoms/Icon.tsx";
import styles from "./LiveCommentTab.module.css";

type Props = {
  /** 表示するコメント列 (古い順)。 */
  comments: LiveComment[];
  /** 実況ソースに接続済みか。 */
  connected: boolean;
  /** 購読できた取得元。2 つ以上なら各コメントに取得元バッジを出す。 */
  sources?: CommentSourceId[];
  /** ユーザ投稿。未対応 (現状の受信専用構成) なら省略し、入力欄ごと隠す。 */
  onPost?: (text: string) => void;
};

/**
 * 実況コメントタブ。feed (CommentFeed: 自動スクロール + 最新へボタン) + 入力欄
 * (onPost があるとき)。未接続かつコメント空のときは案内のみ。取得元が複数あると
 * 各コメントに取得元バッジを出す (取得元の有効/無効は設定画面で行う)。
 */
export default function LiveCommentTab(
  {
    comments,
    connected,
    sources = [],
    onPost,
  }: Props,
) {
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

  const multi = sources.length > 1;
  const disconnected = !connected && comments.length === 0;

  return (
    <div className={styles.tab}>
      {disconnected
        ? (
          <div className={styles.disconnected}>
            {t("watch.live.disconnected")}
          </div>
        )
        : (
          <div className={styles.feedArea}>
            <CommentFeed comments={comments} showSource={multi} />
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
