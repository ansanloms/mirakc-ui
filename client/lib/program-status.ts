/**
 * 番組ステータス記号 (ARIB STD-B24 / Unicode Japanese TV Symbols)。
 *
 * mirakc / Mirakurun の `program.name` には `[字]`(字幕)・`[デ]`(データ放送)・
 * `[SS]`(サラウンドステレオ) のような放送記号が角括弧つきで埋め込まれていることがある。
 * API から記号として直接は取れないため、`name` から抽出してクリーンな表示名と
 * 記号リストに分解する。記号は末尾とは限らず、先頭・中間にも出現しうるため
 * name 全体を走査する。
 */

import { t } from "../locales/i18n.ts";

/** 強調配色。未指定の記号は中立色で描画する。 */
export type MarkTone = "live" | "new" | "warn" | "movie" | "pay";

/** 番組ステータス記号 1 つ分のメタ情報。 */
export type ProgramMark = {
  /** ローマ字キー。React の key / 正準順 / locales (program.mark.<key>) の参照に使う。 */
  key: string;
  /** 表示文字 (角括弧の中身)。 */
  char: string;
  /** 強調配色。未指定は中立。 */
  tone?: MarkTone;
};

/**
 * 記号定義。**配列の並び順が正準表示順 (MARK_ORDER)** を兼ねる。
 * 抽出時はこの配列を検出キーで filter することで整列 + 重複排除を同時に行う。
 * 意味ラベルはここでは持たず locales (program.mark.<key>) で管理する (genre と同じ方針)。
 */
export const PROGRAM_MARKS: ProgramMark[] = [
  { key: "shin", char: "新", tone: "new" },
  { key: "hatsu", char: "初", tone: "new" },
  { key: "fin", char: "終", tone: "warn" },
  { key: "sai", char: "再" },
  { key: "zen", char: "前" },
  { key: "go", char: "後" },
  { key: "ei", char: "映", tone: "movie" },
  { key: "ji", char: "字" },
  { key: "de", char: "デ" },
  { key: "sou", char: "双" },
  { key: "shu", char: "手" },
  { key: "kai", char: "解" },
  { key: "ni", char: "二" },
  { key: "ta", char: "多" },
  { key: "fuki", char: "吹" },
  { key: "koe", char: "声" },
  { key: "en", char: "演" },
  { key: "nama", char: "生", tone: "live" },
  { key: "ten", char: "天" },
  { key: "kou", char: "交" },
  { key: "han", char: "販" },
  { key: "mu", char: "無" },
  { key: "ryo", char: "料", tone: "pay" },
  { key: "ppv", char: "PPV", tone: "pay" },
  { key: "n", char: "N" },
  { key: "s", char: "S" },
  { key: "ss", char: "SS" },
  { key: "bmode", char: "B" },
  { key: "w", char: "W" },
  { key: "prog", char: "P" },
  { key: "hv", char: "HV" },
  { key: "sd", char: "SD" },
  { key: "mv", char: "MV" },
];

/** 角括弧の中身 (char) から記号定義を引く。 */
const MARK_BY_CHAR = new Map(PROGRAM_MARKS.map((mark) => [mark.char, mark]));

/** 記号の意味ラベル。文字列は locales (program.mark.<key>) で管理する。 */
export function markLabel(key: string): string {
  return t(`program.mark.${key}`);
}

/**
 * `program.name` から番組ステータス記号を抽出し、クリーンな表示名と記号リストを返す。
 *
 * - `[X]` 形式 (角括弧 ASCII) のうち、中身が既知記号 (字 / SS / PPV 等) と完全一致する
 *   トークンのみを除去・抽出する。未知の `[...]` や `【】`・`「」` は表示名に残す。
 * - 記号は name 全体 (先頭・中間・末尾) から拾う。
 * - 記号は重複排除し、PROGRAM_MARKS の並び (正準順) で返す。
 * - 表示名は記号除去後に半角スペースの連続を畳み、端を整える (全角スペースの連続は保持)。
 */
export function extractProgramMarks(name?: string | null): {
  name: string;
  marks: ProgramMark[];
} {
  if (!name) {
    return { name: "", marks: [] };
  }

  const found = new Set<string>();
  const stripped = name.replace(/\[([^[\]]+)\]/g, (token, inner: string) => {
    const mark = MARK_BY_CHAR.get(inner);
    if (mark) {
      found.add(mark.key);
      return "";
    }
    return token;
  });

  const displayName = stripped.replace(/ {2,}/g, " ").trim();
  const marks = PROGRAM_MARKS.filter((mark) => found.has(mark.key));

  return { name: displayName, marks };
}
