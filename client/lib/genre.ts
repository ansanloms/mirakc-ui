import type { components } from "./api/schema.d.ts";
import { t } from "../locales/i18n.ts";

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
 * ARIB lv1 ジャンルコード (0..15) とキーの対応。
 * 12..15 (予約・拡張・その他) は "other" に丸める。表示ラベルは持たず
 * locales（genre 名前空間）で管理する。
 */
export const GENRES: { lv1: number; key: GenreKey }[] = [
  { lv1: 0, key: "news" },
  { lv1: 1, key: "sports" },
  { lv1: 2, key: "wideshow" },
  { lv1: 3, key: "drama" },
  { lv1: 4, key: "music" },
  { lv1: 5, key: "variety" },
  { lv1: 6, key: "movie" },
  { lv1: 7, key: "anime" },
  { lv1: 8, key: "documentary" },
  { lv1: 9, key: "performance" },
  { lv1: 10, key: "education" },
  { lv1: 11, key: "welfare" },
];

const BY_LV1 = new Map(GENRES.map((g) => [g.lv1, g.key]));

/** ジャンルキーの表示ラベル。文字列は locales（genre）で管理する。 */
export function genreLabel(key: GenreKey): string {
  return t(`genre.${key}`);
}

function withLabel(key: GenreKey): { key: GenreKey; label: string } {
  return { key, label: genreLabel(key) };
}

/** lv1 コードからジャンル情報を引く。未知/予約は "other"。 */
export function genreByLv1(lv1: number): { key: GenreKey; label: string } {
  return withLabel(BY_LV1.get(lv1) ?? "other");
}

/** 番組の先頭ジャンルからキー・ラベルを得る。 */
export function genreOf(program: Program): { key: GenreKey; label: string } {
  const key = program.genres
    ?.map((g) => BY_LV1.get(g.lv1))
    .find((k): k is GenreKey => k !== undefined);
  return withLabel(key ?? "other");
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
