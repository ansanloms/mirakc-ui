import type { GenreKey } from "../../lib/genre.ts";
import { genreLabel, genreVars } from "../../lib/genre.ts";
import styles from "./GenreTag.module.css";

type Props = {
  /** ジャンルキー (palette トークンと対応)。表示ラベルは locales から解決する。 */
  genreKey: GenreKey;
};

/** ジャンルのピル。塗り背景 + ジャンル色のドット・枠線。 */
export default function GenreTag({ genreKey }: Props) {
  const v = genreVars(genreKey);
  const label = genreLabel(genreKey);
  return (
    <span
      className={styles.tag}
      style={{ background: v.fill, color: v.ink, borderColor: v.strong }}
    >
      <span className={styles.dot} style={{ background: v.strong }} />
      {label}
    </span>
  );
}
