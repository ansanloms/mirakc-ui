import DishIcon from "../atoms/DishIcon.tsx";
import styles from "./Empty.module.css";

type Props = {
  /** 見出し。 */
  title: string;

  /** 案内文。 */
  description: string;

  /**
   * コンパクト表示。狭い領域 (視聴ページの番組選択パネルなど) 向けにアイコンと
   * 文字サイズを小さくする。
   */
  compact?: boolean;
};

/**
 * 空状態の表示。放送局が 1 つも無い (band 未接続など) 場合に、パラボラアンテナの
 * アイコンと見出し・案内文を中央へ表示する。番組表・視聴ページで共有する。
 */
export default function Empty(props: Props) {
  return (
    <div
      className={`${styles.container} ${props.compact ? styles.compact : ""}`}
    >
      <div className={styles.card}>
        <span className={styles.icon}>
          <DishIcon size={props.compact ? 36 : 46} />
        </span>
        <h2 className={styles.title}>{props.title}</h2>
        <p className={styles.text}>{props.description}</p>
      </div>
    </div>
  );
}
