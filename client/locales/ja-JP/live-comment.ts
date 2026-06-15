export default {
  title: "実況連携",
  subtitle: "チャンネルごとの実況コメント割り当て",
  loading: "設定を読み込んでいます",
  add: "チャンネルを追加",
  toolbar: {
    epg: "番組表へ",
    settings: "設定へ",
  },

  // デフォルト設定の一括登録
  defaults: {
    button: "デフォルト設定を登録",
    regionLabel: "地域",
    confirm: "現状の設定が上書きされます",
    apply: "登録する",
    cancel: "キャンセル",
  },

  // 取得元 (視聴のフィルタチップ・コメントバッジ・設定で共有)
  source: {
    nicolive: {
      label: "ニコ生",
      sub: "NDGR",
      tag: "ニコ生",
      note:
        "ニコニコ生放送の番組に直接接続します。番組ページ URL の末尾 ID を入力します。",
    },
    "nx-jikkyo": {
      label: "NX-Jikkyo",
      sub: "互換 API",
      tag: "NX",
      note:
        "NX-Jikkyo (ニコニコ実況の後継互換サービス) から取得します。実況チャンネル番号を入力します。",
    },
    bsky: {
      label: "Bluesky",
      sub: "AT Protocol",
      tag: "bsky",
      note: "",
    },
  },

  head: {
    title: "実況連携",
    summary: "チャンネル {{total}} 件（有効 {{enabled}} 件）",
  },

  empty: {
    title: "割り当てがありません",
    description:
      "チャンネルを追加して、ニコ生 / NX-Jikkyo の実況チャンネルを割り当てます。",
  },

  card: {
    enable: "{{channel}} の実況を有効にする",
    disable: "{{channel}} の実況を停止する",
    off: "停止中",
    noAssignments: "割り当てなし",
    edit: "編集",
    remove: "削除",
    confirm: "削除しますか？",
    confirmRemove: "削除",
    confirmCancel: "キャンセル",
  },

  modal: {
    titleNew: "チャンネルを追加",
    titleEdit: "割り当てを編集",
    lead: "チャンネルを選び、取得元ごとの実況チャンネル ID を割り当てます。",
    channel: "チャンネル",
    channelRequired: "必須",
    channelTaken: "設定済み",
    channelHint: "実況コメントを割り当てるチャンネルを選びます",
    assignments: "実況チャンネル ID",
    assignmentsOptional: "0 個以上",
    addAssignment: "割り当てを追加",
    sourceLabel: "取得元",
    idLabel: "実況チャンネル ID",
    idPlaceholder: {
      nicolive: "ch2646436",
      "nx-jikkyo": "jk1",
    },
    removeAssignment: "割り当てを削除",
    assignmentsEmpty: "割り当てがありません。「割り当てを追加」から設定します。",
    format: {
      nicolive: "ch数字",
      "nx-jikkyo": "jk数字",
    },
    error: {
      format: "ID は正しい形式で入力してください（{{count}}件）",
      duplicate: "同じ取得元・ID が重複しています（{{ids}}）",
    },
    hint: {
      nicolive:
        "例: NHK総合 → ch2646436。番組 URL https://live.nicovideo.jp/watch/ch2646436 の末尾の ID です。",
      "nx-jikkyo": "例: NHK総合 → jk1、BS11 → jk211。実況チャンネルの番号です。",
    },
    save: "追加する",
    saveEdit: "保存する",
    cancel: "キャンセル",
  },

  // 視聴画面のコメント取得元フィルタ (後続 PR で使う)
  filter: {
    label: "取得元",
    empty: {
      title: "取得元が選択されていません",
      description: "上の取得元を選ぶとコメントが表示されます。",
    },
  },
};
