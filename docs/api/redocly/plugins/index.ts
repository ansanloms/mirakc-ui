// redocly plugin inline-examples (ansanloms/redocly-plugin-inline-examples) の
// ローカルラッパー。
//
// redocly の plugins ローダはローカルファイルパスしか解決できない (URL / import map
// specifier は不可) が、.ts は直接読める。このラッパーを redocly.yaml から参照し、
// ファイル内の import を Deno の import map (deno.json の
// "@ansanloms/redocly-plugin-inline-examples/") 経由で jsDelivr のソースへ解決する。
export { default } from "@ansanloms/redocly-plugin-inline-examples/index.ts";
