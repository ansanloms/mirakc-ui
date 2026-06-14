// textlint plugin yaml-keys (ansanloms/textlint-plugin-yaml-keys) のローカルラッパー。
//
// textlint の plugin ローダは Node の require で動くため URL や import map の
// specifier を直接は解決できないが、ローカルの ESM ファイルは絶対パスで
// 読み込める。このファイル内の import は Deno の import map (deno.json の
// "@ansanloms/textlint-plugin-yaml-keys/") 経由で jsDelivr のソースへ解決される。
//
// 配信物の index.js (deno bundle 出力) は createRequire(import.meta.url) を
// 含み https を基底にできず URL import で落ちるため、ソースの index.ts を import する。
import plugin from "@ansanloms/textlint-plugin-yaml-keys/index.ts";

export default plugin;
