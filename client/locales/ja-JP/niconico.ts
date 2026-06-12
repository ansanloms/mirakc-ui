export default {
  title: "ニコニコ実況連携",
  subtitle: "チャンネルと実況チャンネルの割り当て",
  lead:
    "各チャンネルをニコニコ実況のチャンネル ID (ch2646436 など) に割り当てます。割り当てたチャンネルの実況コメントが視聴画面に表示されます。",
  loading: "設定を読み込んでいます",
  backToSettings: "設定へ戻る",

  card: {
    title: "チャンネル割り当て",
    description: "チャンネルを選択し、対応する実況チャンネル ID を入力します。",
  },

  table: {
    channel: "チャンネル",
    channelId: "ニコニコ実況 ID",
  },

  row: {
    selectChannel: "チャンネルを選択…",
    selectLabel: "チャンネル選択",
    inputLabel: "ニコニコ実況チャンネル ID",
    placeholder: "ch2646436",
    add: "行を追加",
    remove: "行を削除",
  },

  empty: "割り当てがありません。「行を追加」から設定してください。",
  addRow: "行を追加",

  error: {
    format:
      "実況チャンネル ID は ch数字 の形式で入力してください ({{count}}件)",
    duplicate:
      "同じ実況チャンネル ID が複数の行に割り当てられています ({{ids}})",
  },
  hint:
    "例: NHK総合 → ch2646436 (jk1)。番組 URL https://live.nicovideo.jp/watch/ch2646436 の末尾の ID です。チャンネルを選ぶと既知の ID は自動入力されます。",

  toast: {
    saved: "割り当てを保存しました",
    saveFailed: "保存に失敗しました",
  },
};
