import type { GenreKey } from "../../lib/genre.ts";
import { genreVars } from "../../lib/genre.ts";
import styles from "./GenreTag.module.css";

type Props = {
  /** ジャンルキー (palette トークンと対応)。 */
  genreKey: GenreKey;
  /** 表示ラベル。 */
  label: string;
};

/** ジャンルのピル。塗り背景 + ジャンル色のドット・枠線。 */
export default function GenreTag({ genreKey, label }: Props) {
  const v = genreVars(genreKey);
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
