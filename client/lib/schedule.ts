import type { components } from "./api/schema.d.ts";

type RecordingScheduleState = components["schemas"]["RecordingScheduleState"];

/** 録画ステータスバッジの表示種別。mirakc の state 6 値を 4 カテゴリへ畳んだもの。 */
export type RecordingStatusKind =
  | "reserved"
  | "recording"
  | "failed"
  | "recorded";

/**
 * mirakc の録画スケジュール state (RecordingScheduleState) を表示カテゴリへ
 * マッピングする。
 *
 * - `scheduled` / `tracking` → `reserved`（録画予約）
 * - `recording` → `recording`（録画中）
 * - `rescheduling` / `failed` → `failed`（録画失敗）
 * - `finished` → `recorded`（録画済）
 *
 * `tracking` は on-air manager 有効時のみ現れる予約待ちの中間状態、
 * `rescheduling` は番組開始前に録画が止まった再試行可能な失敗状態。
 * state が増えた場合は union 網羅の型エラーで気付けるようにしている。
 */
export function recordingStatusKind(
  state: RecordingScheduleState,
): RecordingStatusKind {
  switch (state) {
    case "scheduled":
    case "tracking":
      return "reserved";
    case "recording":
      return "recording";
    case "rescheduling":
    case "failed":
      return "failed";
    case "finished":
      return "recorded";
  }
}
