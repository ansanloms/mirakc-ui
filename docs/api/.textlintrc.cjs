// rules / plugins は node_modules のパッケージ名で解決する。
//   - "preset-ja-technical-writing" 他 4 つの rule -> npm レジストリのパッケージ (textlint-rule-preset-* 等)
//   - "@ansanloms/textlint-plugin-yaml-keys"       -> @ansanloms/textlint-plugin-yaml-keys (git 依存)
// textlint-plugin-yaml-keys は GitHub のタグを git 依存 (package.json の github:ansanloms/<repo>#<tag>) で
// 参照している。Dependabot は git 依存を更新しないため、バージョン更新は package.json のタグを手で書き換えて
// `npm install` で lockfile を更新する。redocly-plugin-inline-examples も同様。
//
// 個別 rule の options はこのファイルが持つ。各 preset の既定から options を変える rule と、
// 無効化する rule だけを書く。書いていない rule は preset の既定で動く。
module.exports = {
  plugins: {
    "@ansanloms/textlint-plugin-yaml-keys": {
      // 抽出対象とする yaml キー。`*` / `[]` / 階層パス対応。詳細は ansanloms/textlint-plugin-yaml-keys を参照。
      keys: ["description", "summary"],
    },
  },
  rules: {
    "preset-ja-technical-writing": {
      "sentence-length": { max: 600 },
      "max-kanji-continuous-len": { max: 15 },
      "no-mix-dearu-desumasu": {
        preferInBody: "である",
        preferInHeader: "である",
        preferInList: "である",
        strict: true,
      },
      "ja-no-weak-phrase": false,
      "no-doubled-joshi": false,
      "ja-no-mixed-period": { forceAppendPeriod: true },
    },
    "preset-ja-spacing": {
      "ja-space-between-half-and-full-width": { space: "always" },
      "ja-space-around-code": { before: true, after: true },
      "ja-space-around-link": { before: true, after: true },
    },
    "preset-jtf-style": {
      // 文体は no-mix-dearu-desumasu が唯一決める。1.1.1.本文 は多数決で敬体を要求し矛盾する指摘を出すため無効化する。
      "1.1.1.本文": false,
      "1.1.3.箇条書き": false,
      // JTF 外来語辞書は「プラットフォーム → プラットホーム」「インタフェース → インターフェイス」
      // のような表記を要求し、一般的な技術文書の表記と合わないため無効のままにする。
      "2.1.5.カタカナ": false,
      "3.1.1.全角文字と半角文字の間": false,
      "4.2.6.ハイフン(-)": false,
      "4.2.7.コロン(：)": false,
      "4.3.1.丸かっこ（）": false,
      "4.3.2.大かっこ［］": false,
      "4.3.7.山かっこ<>": false,
    },
    "@textlint-ja/preset-ai-writing": {
      // 「**ラベル**: 説明」の形の箇条書きを許容するため太字ラベルの検出だけを止める。
      // 装飾絵文字の検出 (ListItem の本文全体を対象にする) は残す。
      "no-ai-list-formatting": { disableBoldListItems: true },
    },
    "@proofdict/proofdict": {
      dictURL: "https://azu.github.io/proof-dictionary/",
      autoUpdateInterval: 1000,
    },
  },
};
