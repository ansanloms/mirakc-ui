export default {
  title: "録画一覧",
  cancel: "録画キャンセル",
  record: "録画する",
  status: {
    label: "ステータス",
    state: {
      scheduled: "スケジュール済",
      tracking: "トラッキング中",
      recording: "録画中",
      rescheduling: "再スケジューリング",
      finished: "完了",
      failed: "失敗",
    },
  },
  failedReason: {
    label: "失敗理由",
    type: {
      "start-recording-failed": "録画開始に失敗",
      "io-error": "I/O エラー",
      "pipeline-error": "パイプラインエラー",
      "need-rescheduling": "再スケジューリング",
      "schedule-expired": "スケジュール期限切れ",
      "removed-from-epg": "EPG から削除された",
    },
  },
  saveFileName: "保存ファイル名",
};
