import ProgramDatePicker from "../../molecules/Program/DatePicker.tsx";
import ChannelTypeTabList from "../../molecules/Program/ChannelTypeTabList.tsx";
import SearchTrigger from "../../molecules/Program/SearchTrigger.tsx";
import IconButton from "../../atoms/IconButton.tsx";
import ColorSchemeToggle from "../../../islands/ColorSchemeToggle.tsx";
import { t } from "../../../locales/i18n.ts";
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

  /** 設定ポータル (/settings) を開く。キーワード自動録画もここから辿る。 */
  onOpenSettings: () => void;

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

      <div className={styles.right}>
        <IconButton
          icon="settings"
          label={t("settings.open")}
          onClick={props.onOpenSettings}
        />
        <ColorSchemeToggle />
      </div>
    </header>
  );
}
