import { type BandId, bandLabel, BANDS } from "../../../lib/service.ts";
import styles from "./BandTabList.module.css";

type Props = {
  /** 選択中の band。 */
  band: BandId;

  /** band を切り替える。 */
  onChangeBand: (band: BandId) => void;
};

/** 地上波 / BS / CS の band 切替タブ。 */
export default function BandTabList(props: Props) {
  return (
    <div className={styles.bandTabs}>
      {BANDS.map((id) => (
        <button
          key={id}
          type="button"
          className={`${styles.bandTab} ${
            props.band === id ? styles.bandTabActive : ""
          }`}
          onClick={() => props.onChangeBand(id)}
        >
          {bandLabel(id)}
        </button>
      ))}
    </div>
  );
}
