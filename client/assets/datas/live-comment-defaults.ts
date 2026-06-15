/**
 * 実況連携設定の地域別デフォルトデータ。
 *
 * `/settings/live-comments` の「デフォルト設定を登録」で、選択した地域の割り当てを
 * 一括登録する元データ。`channel` は `MirakurunChannel.channel`(地上波は物理ch番号、
 * BS は `BS<TP>_<slot>`)で、地域・チューナ構成に依存する。登録時は mirakc に
 * 実在する channel だけを対象にし、存在しないもの(未設定の放送波等)は無視する。
 *
 * 値の出典:
 * - 物理ch 24..27 / BS15_0 ... 本リポジトリの client/lib/fixtures.ts
 * - 物理ch 16 / 21..23 ... 東京スカイツリーの地上デジタル割当(関東広域)
 * - nx-jikkyo(jk番号) ... ニコニコ実況 / NX-Jikkyo の実況チャンネル番号
 * - nicolive(ch番号) ... 本家ニコニコ実況のニコニコチャンネル ID
 *   (旧 server/lib/comments/jikkyo.ts の NICOLIVE_CHANNEL_ID_OF より)
 *
 * 地域を増やすときは LIVE_COMMENT_DEFAULT_REGIONS に要素を足す。
 */
import type { LiveCommentSourceId } from "../../../server/lib/live-comment-settings.ts";

/** デフォルトの 1 チャンネル分の割り当て(id / createdAt を持たない入力相当)。 */
export type LiveCommentDefaultMapping = {
  /** 対象チャンネル(MirakurunChannel.channel)。 */
  channel: string;
  /** 取得元ごとの実況チャンネル ID。 */
  assignments: { source: LiveCommentSourceId; channelId: string }[];
};

/** 地域ごとのデフォルト。select の選択肢になる。 */
export type LiveCommentDefaultRegion = {
  /** 地域の識別子。 */
  id: string;
  /** select に出す表示名。 */
  label: string;
  /** その地域の割り当て一覧。 */
  mappings: LiveCommentDefaultMapping[];
};

/** 1 チャンネルに nicolive + nx-jikkyo を割り当てるヘルパ。 */
function both(
  channel: string,
  nicolive: string,
  nxJikkyo: string,
): LiveCommentDefaultMapping {
  return {
    channel,
    assignments: [
      { source: "nicolive", channelId: nicolive },
      { source: "nx-jikkyo", channelId: nxJikkyo },
    ],
  };
}

export const LIVE_COMMENT_DEFAULT_REGIONS: LiveCommentDefaultRegion[] = [
  {
    id: "kanto",
    label: "関東",
    mappings: [
      both("27", "ch2646436", "jk1"), // NHK総合
      both("26", "ch2646437", "jk2"), // NHK Eテレ
      both("25", "ch2646438", "jk4"), // 日本テレビ
      both("24", "ch2646439", "jk5"), // テレビ朝日
      both("22", "ch2646440", "jk6"), // TBS
      both("23", "ch2646441", "jk7"), // テレビ東京
      both("21", "ch2646442", "jk8"), // フジテレビ
      both("16", "ch2646485", "jk9"), // TOKYO MX
      both("BS15_0", "ch2647992", "jk101"), // NHK BS
    ],
  },
];
