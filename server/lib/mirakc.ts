/**
 * mirakc の各エンドポイント URL の構築。
 *
 * 環境変数 `MIRAKC_URL` は mirakc のベース URL (例: http://mirakc:40772) を
 * 指し、Web API (`/api`) と SSE (`/events`) はここから組み立てる。
 * `/events` は `/api` の外 (ルート直下) にマウントされているため、
 * API の URL だけでは導出できない — ベース URL を単一ソースにする。
 */

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/** mirakc の Web API のベース URL (`${MIRAKC_URL}/api`)。 */
export function mirakcApiUrlOf(mirakcUrl: string): string {
  return `${trimTrailingSlash(mirakcUrl)}/api`;
}

/** mirakc の SSE エンドポイント (`${MIRAKC_URL}/events`)。 */
export function mirakcEventsUrlOf(mirakcUrl: string): string {
  return `${trimTrailingSlash(mirakcUrl)}/events`;
}
