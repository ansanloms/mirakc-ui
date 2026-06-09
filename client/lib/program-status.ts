/**
 * 番組ステータス記号 (ARIB STD-B24 / Unicode Japanese TV Symbols)。
 *
 * mirakc / Mirakurun の `program.name` には `[字]`(字幕)・`[デ]`(データ放送)・
 * `[SS]`(サラウンドステレオ) のような放送記号が角括弧つきで埋め込まれていることがある。
 * API から記号として直接は取れないため、`name` から抽出してクリーンな表示名と
 * 記号リストに分解する。記号は末尾とは限らず、先頭・中間にも出現しうるため
 * name 全体を走査する。
 */

/** 強調配色。未指定の記号は中立色で描画する。 */
export type MarkTone = "live" | "new" | "warn" | "movie" | "pay";

/** 番組ステータス記号 1 つ分のメタ情報。 */
export type ProgramMark = {
  /** ローマ字キー。React の key / 正準順の識別子に使う。 */
  key: string;
  /** 表示文字 (角括弧の中身)。 */
  char: string;
  /** 記号の意味。tooltip (title 属性) に使う。 */
  label: string;
  /** 強調配色。未指定は中立。 */
  tone?: MarkTone;
};

/**
 * 記号定義。**配列の並び順が正準表示順 (MARK_ORDER)** を兼ねる。
 * 抽出時はこの配列を検出キーで filter することで整列 + 重複排除を同時に行う。
 * char / label は ARIB 記号固有のメタなので locales ではなくここで持つ。
 */
export const PROGRAM_MARKS: ProgramMark[] = [
  { key: "shin", char: "新", label: "新番組", tone: "new" },
  { key: "hatsu", char: "初", label: "初回放送", tone: "new" },
  { key: "fin", char: "終", label: "最終回", tone: "warn" },
  { key: "sai", char: "再", label: "再放送" },
  { key: "zen", char: "前", label: "前編" },
  { key: "go", char: "後", label: "後編" },
  { key: "ei", char: "映", label: "映画", tone: "movie" },
  { key: "ji", char: "字", label: "字幕放送" },
  { key: "de", char: "デ", label: "データ放送連動" },
  { key: "sou", char: "双", label: "双方向放送" },
  { key: "shu", char: "手", label: "手話放送" },
  { key: "kai", char: "解", label: "解説放送" },
  { key: "ni", char: "二", label: "二カ国語放送" },
  { key: "ta", char: "多", label: "音声多重放送" },
  { key: "fuki", char: "吹", label: "吹替版" },
  { key: "koe", char: "声", label: "声優" },
  { key: "en", char: "演", label: "出演" },
  { key: "nama", char: "生", label: "生放送", tone: "live" },
  { key: "ten", char: "天", label: "天気予報" },
  { key: "kou", char: "交", label: "交通情報" },
  { key: "han", char: "販", label: "通信販売" },
  { key: "mu", char: "無", label: "無料放送" },
  { key: "ryo", char: "料", label: "有料放送", tone: "pay" },
  { key: "ppv", char: "PPV", label: "ペイパービュー", tone: "pay" },
  { key: "n", char: "N", label: "ニュース" },
  { key: "s", char: "S", label: "ステレオ放送" },
  { key: "ss", char: "SS", label: "サラウンドステレオ放送" },
  { key: "bmode", char: "B", label: "Bモードステレオ放送" },
  { key: "w", char: "W", label: "ワイド放送" },
  { key: "prog", char: "P", label: "プログレッシブ放送" },
  { key: "hv", char: "HV", label: "HDTV" },
  { key: "sd", char: "SD", label: "SDTV" },
  { key: "mv", char: "MV", label: "マルチビューテレビ" },
];

/** 角括弧の中身 (char) から記号定義を引く。 */
const MARK_BY_CHAR = new Map(PROGRAM_MARKS.map((mark) => [mark.char, mark]));

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
