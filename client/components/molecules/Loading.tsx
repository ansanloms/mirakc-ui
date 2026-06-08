import styles from "./Loading.module.css";

type Props = {
  /** ローディングの説明文 (例: 「番組表を読み込んでいます」)。省略時は非表示。 */
  label?: string;
};

/**
 * 放送電波の拡散をイメージしたローディング表示。中心のドットから 3 本のリングが
 * 広がるアニメーションと、任意の説明文を縦に並べる。
 */
export default function Loading({ label }: Props) {
  return (
    <div className={styles.loader}>
      <div className={styles.mark}>
        <span className={styles.ring} />
        <span className={styles.ring} />
        <span className={styles.ring} />
        <span className={styles.dot} />
      </div>
      {label ? <p className={styles.text}>{label}</p> : null}
    </div>
  );
}
