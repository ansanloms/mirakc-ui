import { type BandId, BANDS } from "../../../lib/service.ts";
import styles from "./BandTabs.module.css";

type Props = {
  /** 選択中の band。 */
  band: BandId;

  /** band を切り替える。 */
  onChangeBand: (band: BandId) => void;
};

/** 地上波 / BS / CS の band 切替タブ。 */
export default function BandTabs(props: Props) {
  return (
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
  );
}
