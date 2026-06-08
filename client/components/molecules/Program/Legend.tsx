import { GENRES, genreVars } from "../../../lib/genre.ts";
import styles from "./Legend.module.css";

/**
 * 番組表のジャンル凡例バー。GENRES をループしてジャンル色のドットとラベルを並べる。
 * 横スクロール可能。表示専用 (props 無し)。
 */
export default function ProgramLegend() {
  return (
    <div className={styles.legend}>
      {GENRES.map((g) => (
        <span key={g.key} className={styles.item}>
          <span
            className={styles.dot}
            style={{ background: genreVars(g.key).strong }}
          />
          {g.label}
        </span>
      ))}
    </div>
  );
}
