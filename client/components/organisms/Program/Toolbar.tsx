import ProgramDatePicker from "../../molecules/Program/DatePicker.tsx";
import ChannelTypeTabList from "../../molecules/Program/ChannelTypeTabList.tsx";
import SearchTrigger from "../../molecules/Program/SearchTrigger.tsx";
import KeywordRulesTrigger from "../../molecules/Program/KeywordRulesTrigger.tsx";
import ColorSchemeToggle from "../../../islands/ColorSchemeToggle.tsx";
import type { ChannelType } from "../../../lib/service.ts";
import styles from "./Toolbar.module.css";

type Props = {
  /** 表示対象日（タイムゾーン付き。日単位で扱う）。 */
  targetDate: Temporal.ZonedDateTime;

  /** 日付を切り替える。 */
  onChangeDate: (date: Temporal.ZonedDateTime) => void;

  /** 選択中の channel type。 */
  channelType: ChannelType;

  /** channel type を切り替える。 */
  onChangeChannelType: (channelType: ChannelType) => void;

  /** 検索モーダルを開く。 */
  onOpenSearch: () => void;

  /** キーワード自動録画の管理ページを開く。 */
  onOpenKeywordRules: () => void;

  /** 「今日」の基準時刻。日付ナビゲーションの起点に使う。テスト時に固定できるよう注入可能。 */
  now?: Temporal.ZonedDateTime;
};

/** 番組表ページ上部のツールバー。日付ナビ・channel type タブ・検索・テーマ切替を束ねる。 */
export default function ProgramToolbar(props: Props) {
  return (
    <header className={styles.toolbar}>
      <ProgramDatePicker
        targetDate={props.targetDate}
        onChangeDate={props.onChangeDate}
        now={props.now}
      />
      <ChannelTypeTabList
        channelType={props.channelType}
        onChangeChannelType={props.onChangeChannelType}
      />
      <SearchTrigger onOpen={props.onOpenSearch} />
      <KeywordRulesTrigger onOpen={props.onOpenKeywordRules} />

      <div className={styles.right}>
        <ColorSchemeToggle />
      </div>
    </header>
  );
}
