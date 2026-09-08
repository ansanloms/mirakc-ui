// rules と plugins はいずれも --rules-base-directory (deno.json の textlint task が
// "$PWD/textlint" を渡す) 配下の、textlint の命名規則に従うディレクトリで解決する。
//   - "preset-ansanloms" -> textlint/textlint-rule-preset-ansanloms/index.js
//   - "yaml-keys"        -> textlint/textlint-plugin-yaml-keys/index.js
// textlint のローダは Node の require で動き、URL や import map の specifier を直接は
// 解決できないため、各 index.js が import map (deno.json) 経由で jsDelivr 配信の実体を
// 再 export する薄いラッパーになっている。
//
// 制約:
//   - --rules-base-directory を渡すと resolver は base dir 配下しか探さない。rule・
//     filter・plugin を後から足すときも、同じ形のラッパーディレクトリを textlint/ に置く。
//   - ラッパーの解決に失敗しても textlint は "No rules found" としか出さない。原因は
//     `DEBUG='textlint:*' deno task textlint --debug <file>` で確認できる。
//   - preset-ansanloms と yaml-keys の実体は deno.json の import map で jsDelivr の
//     タグ付き URL に固定している。同様に URL 固定の依存として、ディレクトリ指定の
//     redocly-plugin-inline-examples がある (計 3 件)。Dependabot の deno エコシステムは
//     npm: / jsr: 指定しか更新しないため、これらのバージョン更新は deno.json の URL を
//     手で書き換え、deno.lock を更新する。textlint の 2 件は `deno install` で反映される。
//     ディレクトリ指定の redocly-plugin-inline-examples は `deno install` では解決されず、
//     `deno task lint:redocly` (または `deno task build:bundle`) の実行時に反映される。
//     `deno task lint` は手前の段が落ちると lint:redocly に到達しないので、直接実行する。
//
// 個別 rule の options は preset 側 (ansanloms/textlint-rule-preset-ansanloms の index.ts) が
// 持ち、ここでは上書きしない。
module.exports = {
  plugins: {
    "yaml-keys": {
      // 抽出対象とする yaml キー。`*` / `[]` / 階層パス対応。詳細は ansanloms/textlint-plugin-yaml-keys を参照。
      keys: ["description", "summary"],
    },
  },
  rules: {
    "preset-ansanloms": true,
  },
};
