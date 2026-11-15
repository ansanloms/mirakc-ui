// Vitest 用の mpegts.js スタブ。
//
// Player.tsx は `import("mpegts.js")` を動的 import する。テストでは Player に
// ローダーを pending で注入して実行はさせないため、ブラウザ API に依存する本体の
// 代わりにこのスタブへ alias する (vitest.config.ts の test.alias)。スタブの中身は
// 呼ばれない想定なので最小限にする。
export default {
  isSupported: () => false,
  createPlayer: () => ({}),
  Events: {},
};
