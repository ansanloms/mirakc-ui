import ProgramDatePicker from "../../molecules/Program/DatePicker.tsx";
import BandTabs from "../../molecules/Program/BandTabs.tsx";
import SearchTrigger from "../../molecules/Program/SearchTrigger.tsx";
import ColorSchemeToggle from "../../../islands/ColorSchemeToggle.tsx";
import type { BandId } from "../../../lib/service.ts";
import styles from "./Toolbar.module.css";

type Props = {
  /** 表示対象日（タイムゾーン付き。日単位で扱う）。 */
  targetDate: Temporal.ZonedDateTime;

  /** 日付を切り替える。 */
  onChangeDate: (date: Temporal.ZonedDateTime) => void;

  /** 選択中の band。 */
  band: BandId;

  /** band を切り替える。 */
  onChangeBand: (band: BandId) => void;

  /** 検索モーダルを開く。 */
  onOpenSearch: () => void;

  /** 「今日」の基準時刻。日付ナビゲーションの起点に使う。テスト時に固定できるよう注入可能。 */
  now?: Temporal.ZonedDateTime;
};

/** 番組表ページ上部のツールバー。日付ナビ・band タブ・検索・テーマ切替を束ねる。 */
export default function ProgramToolbar(props: Props) {
  return (
    <header className={styles.toolbar}>
      <ProgramDatePicker
        targetDate={props.targetDate}
        onChangeDate={props.onChangeDate}
        now={props.now}
      />
      <BandTabs band={props.band} onChangeBand={props.onChangeBand} />
      <SearchTrigger onOpen={props.onOpenSearch} />

      <div className={styles.right}>
        <ColorSchemeToggle />
      </div>
    </header>
  );
}
