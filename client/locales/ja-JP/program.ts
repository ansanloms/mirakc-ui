export default {
  title: "番組表",
  loading: "番組表を読み込んでいます",

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

  // 番組ステータス記号 (ARIB STD-B24) の表示文言。
  // キーは program-status.ts の MARK_DEFS の key と対応する。
  // short = グリッド (番組表セル) の囲み文字、label = 詳細・ツールチップの意味ラベル。
  mark: {
    shin: { short: "新", label: "新番組" },
    hatsu: { short: "初", label: "初回放送" },
    fin: { short: "終", label: "最終回" },
    sai: { short: "再", label: "再放送" },
    zen: { short: "前", label: "前編" },
    go: { short: "後", label: "後編" },
    ei: { short: "映", label: "映画" },
    ji: { short: "字", label: "字幕放送" },
    de: { short: "デ", label: "データ放送連動" },
    sou: { short: "双", label: "双方向放送" },
    shu: { short: "手", label: "手話放送" },
    kai: { short: "解", label: "解説放送" },
    ni: { short: "二", label: "二カ国語放送" },
    ta: { short: "多", label: "音声多重放送" },
    fuki: { short: "吹", label: "吹替版" },
    koe: { short: "声", label: "声優" },
    en: { short: "演", label: "出演" },
    nama: { short: "生", label: "生放送" },
    ten: { short: "天", label: "天気予報" },
    kou: { short: "交", label: "交通情報" },
    han: { short: "販", label: "通信販売" },
    mu: { short: "無", label: "無料放送" },
    ryo: { short: "料", label: "有料放送" },
    ppv: { short: "PPV", label: "ペイパービュー" },
    n: { short: "N", label: "ニュース" },
    s: { short: "S", label: "ステレオ放送" },
    ss: { short: "SS", label: "サラウンドステレオ放送" },
    bmode: { short: "B", label: "Bモードステレオ放送" },
    w: { short: "W", label: "ワイド放送" },
    prog: { short: "P", label: "プログレッシブ放送" },
    hv: { short: "HV", label: "HDTV" },
    sd: { short: "SD", label: "SDTV" },
    mv: { short: "MV", label: "マルチビューテレビ" },
  },

  channelType: {
    GR: "地上波",
    BS: "BS",
    CS: "CS",
    SKY: "スカパー！",
  },

  empty: {
    title: "{{channelType}}の放送局がありません",
    description:
      "チューナーが{{channelType}}に接続されていないか、放送局が見つかりません。アンテナの接続と受信設定をご確認ください。",
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
