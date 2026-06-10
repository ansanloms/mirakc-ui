export default {
  test: {
    title: "テスト通知",
    message: "mirakc-ui からのテスト通知です。",
  },
  recording: {
    fallbackName: "番組 ID: {{programId}}",
    startedAt: "{{datetime}} 開始",
    airtime: "{{start}} 〜 {{end}}",
    started: {
      title: "録画開始: {{name}}",
      message: "録画を開始しました。",
    },
    stopped: {
      title: "録画終了: {{name}}",
      message: "録画を終了しました。",
    },
    failed: {
      title: "録画失敗: {{name}}",
      message: "録画に失敗しました。",
    },
    scheduled: {
      title: "録画登録: {{name}}",
      message: "録画予約を登録しました。",
    },
    unscheduled: {
      title: "録画削除: {{name}}",
      message: "録画予約を削除しました。",
    },
  },
  keyword: {
    title: "録画登録: {{name}}",
    message: "キーワード「{{keyword}}」に一致する番組を予約しました。",
  },
};
