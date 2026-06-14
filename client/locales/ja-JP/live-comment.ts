export default {
  title: "実況連携",
  subtitle: "コメント取得元とチャンネルの割り当て",
  lead:
    "コメントの取得元を選び、各チャンネルを実況チャンネルに割り当てます。割り当てたチャンネルのコメントが視聴画面に表示されます。",
  loading: "設定を読み込んでいます",
  backToSettings: "設定へ戻る",

  // 取得元 (視聴のフィルタチップ・コメントバッジ・設定セグメントで共有)
  source: {
    title: "コメント取得元",
    description: "どのサービスからコメントを取得するかを選びます",
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

  card: {
    title: "チャンネル割り当て",
    description: "{{source}} の実況チャンネルを各チャンネルに割り当てます",
  },
  table: {
    channel: "チャンネル",
    channelId: "{{source}} ID（{{format}}）",
  },
  format: {
    nicolive: "ch数字",
    "nx-jikkyo": "jk数字",
  },
  row: {
    selectChannel: "チャンネルを選択…",
    selectLabel: "チャンネル選択",
    inputLabel: "実況チャンネル ID",
    placeholder: {
      nicolive: "ch2646436",
      "nx-jikkyo": "jk1",
    },
    remove: "行を削除",
    enable: "この割り当てを有効にする",
    disable: "この割り当てを無効にする",
  },
  empty: "割り当てがありません。「行を追加」から設定してください。",
  addRow: "行を追加",
  error: {
    format: "ID は {{format}} の形式で入力してください ({{count}}件)",
    duplicate: "同じ ID が複数の行に割り当てられています ({{ids}})",
  },
  hint: {
    nicolive:
      "例: NHK総合 → ch2646436。番組 URL https://live.nicovideo.jp/watch/ch2646436 の末尾の ID です。",
    "nx-jikkyo": "例: NHK総合 → jk1、BS11 → jk211。実況チャンネルの番号です。",
  },
  hintSuffix: "チャンネルを選ぶと既知の ID は自動入力されます。",

  toast: {
    saved: "設定を保存しました",
    saveFailed: "保存に失敗しました",
  },

  // 視聴画面のコメント取得元フィルタ
  filter: {
    label: "取得元",
    empty: {
      title: "取得元が選択されていません",
      description: "上の取得元を選ぶとコメントが表示されます。",
    },
  },
};
