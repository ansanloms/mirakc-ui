/**
 * 番組ステータス記号 (ARIB STD-B24 / Unicode Japanese TV Symbols)。
 *
 * mirakc / Mirakurun の `program.name` には `[字]`(字幕)・`[デ]`(データ放送)・
 * `[SS]`(サラウンドステレオ) のような放送記号が角括弧つきで埋め込まれていることがある。
 * API から記号として直接は取れないため、`name` から抽出してクリーンな表示名と
 * 記号リストに分解する。記号は末尾とは限らず、先頭・中間にも出現しうるため
 * name 全体を走査する。
 *
 * このモジュールが code 側に持つのは「解析に必要な構造データ」だけ:
 *   - symbol: `program.name` 中に現れる ARIB 記号そのもの。放送データの一致キーであり、
 *             UI 言語に依らず常に同じ (表示文言ではない)。
 *   - tone:   強調配色 (視覚)。
 *   - 配列順 = 正準表示順。
 * 表示文言 (グリッドの短縮表記・詳細のラベル) は locales (program.mark.<key>) が持つ。
 */

import { t } from "../locales/i18n.ts";

/** 強調配色。未指定の記号は中立色で描画する。 */
export type MarkTone = "live" | "new" | "warn" | "movie" | "pay";

/** 抽出結果の記号。表示文言は持たず、key から locales を引いて描画する。 */
export type ProgramMark = {
  /** ローマ字キー。React の key / locales (program.mark.<key>) の参照に使う。 */
  key: string;
  /** 強調配色。未指定は中立。 */
  tone?: MarkTone;
};

/**
 * 記号の解析定義。**配列の並び順が正準表示順** を兼ねる。
 * `symbol` は `program.name` 中の ARIB 記号 (放送データの一致キー) であって表示文言ではない。
 */
type MarkDef = {
  key: string;
  symbol: string;
  tone?: MarkTone;
};

export const MARK_DEFS: MarkDef[] = [
  { key: "shin", symbol: "新", tone: "new" },
  { key: "hatsu", symbol: "初", tone: "new" },
  { key: "fin", symbol: "終", tone: "warn" },
  { key: "sai", symbol: "再" },
  { key: "zen", symbol: "前" },
  { key: "go", symbol: "後" },
  { key: "ei", symbol: "映", tone: "movie" },
  { key: "ji", symbol: "字" },
  { key: "de", symbol: "デ" },
  { key: "sou", symbol: "双" },
  { key: "shu", symbol: "手" },
  { key: "kai", symbol: "解" },
  { key: "ni", symbol: "二" },
  { key: "ta", symbol: "多" },
  { key: "fuki", symbol: "吹" },
  { key: "koe", symbol: "声" },
  { key: "en", symbol: "演" },
  { key: "nama", symbol: "生", tone: "live" },
  { key: "ten", symbol: "天" },
  { key: "kou", symbol: "交" },
  { key: "han", symbol: "販" },
  { key: "mu", symbol: "無" },
  { key: "ryo", symbol: "料", tone: "pay" },
  { key: "ppv", symbol: "PPV", tone: "pay" },
  { key: "n", symbol: "N" },
  { key: "s", symbol: "S" },
  { key: "ss", symbol: "SS" },
  { key: "bmode", symbol: "B" },
  { key: "w", symbol: "W" },
  { key: "prog", symbol: "P" },
  { key: "hv", symbol: "HV" },
  { key: "sd", symbol: "SD" },
  { key: "mv", symbol: "MV" },
];

/** ARIB 記号 (symbol) から定義を引く。`program.name` の解析に使う。 */
const MARK_BY_SYMBOL = new Map(MARK_DEFS.map((def) => [def.symbol, def]));

/** グリッド用の短縮表記 (例: ja「字」)。文言は locales (program.mark.<key>.short)。 */
export function markShort(key: string): string {
  return t(`program.mark.${key}.short`);
}

/** 記号の意味ラベル (例: ja「字幕放送」)。文言は locales (program.mark.<key>.label)。 */
export function markLabel(key: string): string {
  return t(`program.mark.${key}.label`);
}

/**
 * `program.name` から番組ステータス記号を抽出し、クリーンな表示名と記号リストを返す。
 *
 * - `[X]` 形式 (角括弧 ASCII) のうち、中身が既知の ARIB 記号 (字 / SS / PPV 等) と
 *   完全一致するトークンのみを除去・抽出する。未知の `[...]` や `【】`・`「」` は表示名に残す。
 * - 記号は name 全体 (先頭・中間・末尾) から拾う。
 * - 記号は重複排除し、MARK_DEFS の並び (正準順) で返す。
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
    const def = MARK_BY_SYMBOL.get(inner);
    if (def) {
      found.add(def.key);
      return "";
    }
    return token;
  });

  const displayName = stripped.replace(/ {2,}/g, " ").trim();
  const marks: ProgramMark[] = MARK_DEFS
    .filter((def) => found.has(def.key))
    .map((def) => ({ key: def.key, tone: def.tone }));

  return { name: displayName, marks };
}
