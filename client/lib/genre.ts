import type { components } from "./api/schema.d.ts";

type Program = components["schemas"]["MirakurunProgram"];

/**
 * ジャンルのキー。palette.css の `--color-genre-<key>-*` トークンと対応する。
 */
export type GenreKey =
  | "news"
  | "sports"
  | "wideshow"
  | "drama"
  | "music"
  | "variety"
  | "movie"
  | "anime"
  | "documentary"
  | "performance"
  | "education"
  | "welfare"
  | "other";

/**
 * ARIB lv1 ジャンルコード (0..15) とキー・ラベルの対応。
 * 12..15 (予約・拡張・その他) は "other" に丸める。
 */
export const GENRES: { lv1: number; key: GenreKey; label: string }[] = [
  { lv1: 0, key: "news", label: "報道" },
  { lv1: 1, key: "sports", label: "スポーツ" },
  { lv1: 2, key: "wideshow", label: "情報" },
  { lv1: 3, key: "drama", label: "ドラマ" },
  { lv1: 4, key: "music", label: "音楽" },
  { lv1: 5, key: "variety", label: "バラエティ" },
  { lv1: 6, key: "movie", label: "映画" },
  { lv1: 7, key: "anime", label: "アニメ／特撮" },
  { lv1: 8, key: "documentary", label: "ドキュメンタリー／教養" },
  { lv1: 9, key: "performance", label: "劇場／公演" },
  { lv1: 10, key: "education", label: "趣味／教育" },
  { lv1: 11, key: "welfare", label: "福祉" },
];

const BY_LV1 = new Map(GENRES.map((g) => [g.lv1, g]));

/** lv1 コードからジャンル情報を引く。未知/予約は "other"。 */
export function genreByLv1(lv1: number): { key: GenreKey; label: string } {
  return BY_LV1.get(lv1) ?? { key: "other", label: "その他" };
}

/** 番組の先頭ジャンルからキー・ラベルを得る。 */
export function genreOf(program: Program): { key: GenreKey; label: string } {
  const lv1 = program.genres?.find((g) => BY_LV1.has(g.lv1))?.lv1;
  return lv1 === undefined
    ? { key: "other", label: "その他" }
    : genreByLv1(lv1);
}

/**
 * ジャンルキーから CSS カスタムプロパティ参照を得る。
 * インライン style に直接当てる。トークンが light/dark を内包する。
 */
export function genreVars(key: GenreKey): {
  strong: string;
  fill: string;
  ink: string;
} {
  return {
    strong: `var(--color-genre-${key}-strong)`,
    fill: `var(--color-genre-${key}-fill)`,
    ink: `var(--color-genre-${key}-ink)`,
  };
}
