/**
 * トランスコードの画質プリセット定義。
 *
 * client (画質メニュー / URL クエリ検証) と server (transcode API / ffmpeg 設定)
 * の両方がここを単一ソースとして参照する。プリセットを増減する場合は
 * encoder.ts の qualitySettings にも対応エントリを足すこと (Record<Quality, ...>
 * なので型チェックで漏れは検出される)。
 */

export const qualities = ["480p", "720p", "1024p"] as const;

export type Quality = (typeof qualities)[number];

export const defaultQuality: Quality = "1024p";

export function isQuality(value: unknown): value is Quality {
  return (qualities as readonly unknown[]).includes(value);
}

/** 未知の値を fallback (既定は defaultQuality) に丸める。 */
export function normalizeQuality(
  value: unknown,
  fallback: Quality = defaultQuality,
): Quality {
  return isQuality(value) ? value : fallback;
}
