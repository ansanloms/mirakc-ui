import type { components } from "../../../hooks/api/schema.ts";
import { css } from "twind/css";
import Icon from "../../atoms/Icon.tsx";

type Props = {
  recordingSchedule: components["schemas"]["WebRecordingSchedule"];
};

const style = {
  container: css`
grid-template-columns: auto 1fr;
`,
};

const stateLabels = {
  scheduled: "スケジュール済",
  tracking: "トラッキング中",
  recording: "録画中",
  rescheduling: "再スケジューリング",
  finished: "完了",
  failed: "失敗",
} as const;

const failedReasonLabels = {
  "start-recording-failed": "録画開始に失敗",
  "io-error": "I/O エラー",
  "pipeline-error": "パイプラインエラー",
  "need-rescheduling": "再スケジューリング",
  "schedule-expired": "スケジュール期限切れ",
  "removed-from-epg": "EPG から削除された",
} as const;

export default function RecordingItem(
  { recordingSchedule }: Props,
) {
  return (
    <dl class={[style.container, "grid", "gap-x-4", "gap-y-2"]}>
      <dt class="font-bold">ステータス</dt>
      <dd>{stateLabels[recordingSchedule.state]}</dd>
      <dt class="font-bold">保存ファイル名</dt>
      <dd class="font-mono">
        {recordingSchedule.options.contentPath}
      </dd>
      {recordingSchedule.failedReason && (
        <>
          <dt class="font-bold ">失敗理由</dt>
          <dd>
            {failedReasonLabels[recordingSchedule.failedReason.type]}
          </dd>
          {recordingSchedule.failedReason.message && (
            <dd>{recordingSchedule.failedReason.message}</dd>
          )}
        </>
      )}
    </dl>
  );
}
