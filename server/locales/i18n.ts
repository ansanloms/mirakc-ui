/**
 * server 側の表示文言 (ntfy 通知など) の locale 管理。
 *
 * client/locales と同じ「ja-JP/<namespace>.ts + translation.ts + t()」の
 * 構成にして文言をコードから分離する。server は単一ロケール・{{var}} 補間
 * しか要らないため i18next は持ち込まず、同じ呼び出し感の軽量な t() を
 * 実装する (未知キーはキーをそのまま返す挙動も i18next に合わせる)。
 */

import translation from "./ja-JP/translation.ts";

type Vars = Record<string, string | number>;

/** ドット区切りのキーで文言を引き、{{var}} を補間する。 */
export function t(key: string, vars: Vars = {}): string {
  const value = key.split(".").reduce<unknown>(
    (node, segment) =>
      typeof node === "object" && node !== null
        ? (node as Record<string, unknown>)[segment]
        : undefined,
    translation,
  );
  if (typeof value !== "string") {
    return key;
  }
  return value.replace(
    /\{\{(\w+)\}\}/g,
    (placeholder, name: string) =>
      name in vars ? String(vars[name]) : placeholder,
  );
}
