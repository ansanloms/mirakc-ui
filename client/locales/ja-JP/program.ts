export default {
  title: "番組表",
  loading: "番組表を読み込んでいます",

  badge: {
    new: "新",
  },

  // 録画スケジュールの状態 (RecordingScheduleState) ごとの文言。
  // scheduled/tracking, rescheduling/failed は同じ文言になるが重複を許容する。
  recordingStatus: {
    scheduled: "録画予約",
    tracking: "録画予約",
    recording: "録画中",
    rescheduling: "録画失敗",
    finished: "録画済",
    failed: "録画失敗",
  },

  band: {
    GR: "地上波",
    BS: "BS",
    CS: "CS",
  },

  empty: {
    title: "{{band}}の放送局がありません",
    description:
      "チューナーが{{band}}に接続されていないか、放送局が見つかりません。アンテナの接続と受信設定をご確認ください。",
  },

  toolbar: {
    prevDay: "前の日",
    nextDay: "次の日",
    today: "今日",
    search: "番組を検索",
    theme: "テーマ切替",
  },

  detail: {
    content: "番組内容",
    extended: "詳細情報",
    reserve: "録画予約する",
    cancelReserve: "録画予約を解除",
    watch: "視聴する",
    recorded: "録画済",
    close: "閉じる",
  },

  duration: "{{min}}分",
};
