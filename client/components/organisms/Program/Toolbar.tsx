import Icon from "../../atoms/Icon.tsx";
import ProgramDatePicker from "../../molecules/Program/DatePicker.tsx";
import ColorSchemeToggle from "../../../islands/ColorSchemeToggle.tsx";
import { BANDS } from "../../../lib/service.ts";
import { t } from "../../../locales/i18n.ts";
import styles from "./Toolbar.module.css";

type BandId = "GR" | "BS" | "CS";

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

      <div className={styles.bandTabs}>
        {BANDS.map((b) => (
          <button
            key={b.id}
            type="button"
            className={`${styles.bandTab} ${
              props.band === b.id ? styles.bandTabActive : ""
            }`}
            onClick={() => props.onChangeBand(b.id)}
          >
            {b.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        className={styles.searchTrigger}
        onClick={props.onOpenSearch}
      >
        <Icon size={16}>search</Icon>
        <span className={styles.stText}>{t("program.toolbar.search")}</span>
        <kbd className={styles.stKbd}>⌘K</kbd>
      </button>

      <div className={styles.right}>
        <ColorSchemeToggle />
      </div>
    </header>
  );
}
