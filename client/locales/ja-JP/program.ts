export default {
  title: "番組表",
  loading: "番組表を読み込んでいます",

  badge: {
    new: "新",
    reserved: "予約",
    recorded: "録画済",
  },

  // 番組ステータス記号 (ARIB STD-B24) の意味ラベル。
  // キーは program-status.ts の PROGRAM_MARKS の key と対応する。
  mark: {
    shin: "新番組",
    hatsu: "初回放送",
    fin: "最終回",
    sai: "再放送",
    zen: "前編",
    go: "後編",
    ei: "映画",
    ji: "字幕放送",
    de: "データ放送連動",
    sou: "双方向放送",
    shu: "手話放送",
    kai: "解説放送",
    ni: "二カ国語放送",
    ta: "音声多重放送",
    fuki: "吹替版",
    koe: "声優",
    en: "出演",
    nama: "生放送",
    ten: "天気予報",
    kou: "交通情報",
    han: "通信販売",
    mu: "無料放送",
    ryo: "有料放送",
    ppv: "ペイパービュー",
    n: "ニュース",
    s: "ステレオ放送",
    ss: "サラウンドステレオ放送",
    bmode: "Bモードステレオ放送",
    w: "ワイド放送",
    prog: "プログレッシブ放送",
    hv: "HDTV",
    sd: "SDTV",
    mv: "マルチビューテレビ",
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
