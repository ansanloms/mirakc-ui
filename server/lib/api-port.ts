/**
 * API サーバ (Hono) が listen するポートの解釈 (`API_PORT`)。
 *
 * ランタイム固有の API に依存しない純粋モジュールで、server/main.ts (listen) と
 * vite.config.ts (dev proxy の接続先) が同じ判定を使う
 * (server/lib/quality.ts と同じ共有パターン)。
 */

/** 未設定・不正値のときのポート。 */
export const defaultApiPort = 8000;

/**
 * `API_PORT` の値をポート番号にする。未設定・空・非整数・1〜65535 の範囲外なら
 * 既定 (8000)。前後の空白は `Number` が読み飛ばす。
 */
export function apiPortOf(value: string | undefined): number {
  const port = Number(value ?? String(defaultApiPort));
  return Number.isInteger(port) && port > 0 && port <= 65535
    ? port
    : defaultApiPort;
}
