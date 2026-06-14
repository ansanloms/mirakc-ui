import { type FormEvent, useState } from "react";
import type { LiveComment } from "../../../lib/live-comment.ts";
import type { CommentSourceId } from "../../../../server/lib/comments/types.ts";
import { t } from "../../../locales/i18n.ts";
import CommentFeed from "./CommentFeed.tsx";
import SourceFilter from "./SourceFilter.tsx";
import Icon from "../../atoms/Icon.tsx";
import styles from "./LiveCommentTab.module.css";

type Props = {
  /** 表示するコメント列 (選択中の取得元にフィルタ済み、古い順)。 */
  comments: LiveComment[];
  /** 実況ソースに接続済みか。 */
  connected: boolean;
  /** 候補の取得元 (フィルタチップ。2 つ以上でチップを出す)。 */
  sources?: CommentSourceId[];
  /** 表示中の取得元。 */
  selectedSources?: CommentSourceId[];
  /** 取得元の表示 ON/OFF を切り替える。 */
  onToggleSource?: (id: CommentSourceId) => void;
  /** ユーザ投稿。未対応 (現状の受信専用構成) なら省略し、入力欄ごと隠す。 */
  onPost?: (text: string) => void;
};

/**
 * 実況コメントタブ。取得元フィルタ (複数取得元のとき) + feed (CommentFeed:
 * 自動スクロール + 最新へボタン) + 入力欄 (onPost があるとき)。未接続かつ
 * コメント空のときは案内のみ。取得元を全解除したときは別の案内を出す。
 */
export default function LiveCommentTab(
  {
    comments,
    connected,
    sources = [],
    selectedSources = [],
    onToggleSource,
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
  // 取得元が複数あるのに 1 つも選んでいない状態。
  const noSource = connected && multi && selectedSources.length === 0;

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
            {multi && onToggleSource !== undefined && (
              <SourceFilter
                sources={sources}
                selected={selectedSources}
                onToggle={onToggleSource}
              />
            )}
            {noSource
              ? (
                <div className={styles.sourceEmpty}>
                  <span className={styles.sourceEmptyTitle}>
                    {t("liveComment.filter.empty.title")}
                  </span>
                  <span className={styles.sourceEmptyDescription}>
                    {t("liveComment.filter.empty.description")}
                  </span>
                </div>
              )
              : <CommentFeed comments={comments} showSource={multi} />}
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
