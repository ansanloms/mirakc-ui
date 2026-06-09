import { type ProgramMark, markLabel } from "../../lib/program-status.ts";
import styles from "./ProgramMarks.module.css";

type Props = {
  /** 表示する記号。空なら何も描画しない。 */
  marks: ProgramMark[];
  /**
   * 表示バリアント。
   * grid = 番組表セル内 (囲み文字)、title = 見出し末尾 (意味ラベルをインライン)。
   */
  variant?: "grid" | "title";
  /** 表示する最大個数。超過分は切り捨てる。 */
  max?: number;
};

/** 番組ステータス記号 (字幕・データ放送・生放送等) を並べる。 */
export default function ProgramMarks({ marks, variant, max }: Props) {
  if (marks.length === 0) {
    return null;
  }

  const list = max !== undefined ? marks.slice(0, max) : marks;
  const variantClass = variant ? styles[variant] : undefined;

  return (
    <span className={[styles.marks, variantClass].filter(Boolean).join(" ")}>
      {list.map((mark) => {
        const label = markLabel(mark.key);
        return (
          <span
            key={mark.key}
            className={[styles.mark, mark.tone && styles[mark.tone]]
              .filter(Boolean)
              .join(" ")}
            title={label}
          >
            {/* title バリアントは意味ラベル、grid は囲み文字。 */}
            {variant === "title" ? label : mark.char}
          </span>
        );
      })}
    </span>
  );
}
