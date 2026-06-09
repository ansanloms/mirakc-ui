// Vitest 用の mpegts.js スタブ。
//
// Player.tsx は `import("mpegts.js")` (deno.json で esm.sh の URL に解決) を
// 動的 import する。vitest.config の Vite には deno() プラグインが無く、この
// URL import を静的解析時に解決できずスイート読み込みごと失敗する。テストでは
// Player にローダーを pending で注入して実行はさせないが、Vite の import 解析は
// 走るため、解決可能なローカルスタブへ alias する (vitest.config.ts の
// test.alias)。スタブの中身は呼ばれない想定なので最小限にする。
export default {
  isSupported: () => false,
  createPlayer: () => ({}),
  Events: {},
};
