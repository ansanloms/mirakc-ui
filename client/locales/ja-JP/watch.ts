export default {
  title: "視聴",
  subtitle: "選局して番組をライブ視聴します。",
  open: "視聴画面を開く",
  watch: "視聴する",
  loading: "プレイヤーを準備しています",
  selectService: "チャンネルを選択してください",
  back: "番組表",

  buffering: {
    receiving: "{{name}} を受信中",
    receivingUnknown: "受信中",
  },

  empty: {
    title: "{{channelType}}の放送局がありません",
    description:
      "チューナーが{{channelType}}に接続されていないか、放送中の番組情報を取得できていません。受信設定をご確認ください。",
  },

  tab: {
    select: "番組選択",
    info: "番組情報",
    live: "実況コメント",
  },

  select: {
    next: "次: {{title}}",
  },

  info: {
    content: "番組内容",
    extended: "詳細情報",
  },

  live: {
    placeholder: "コメントを入力…",
    send: "送信",
    disconnected: "実況は未接続です",
  },

  caption: {
    label: "字幕",
    show: "字幕 ON",
    hide: "字幕 OFF",
  },
  audio: {
    label: "音声",
    main: "主音声",
    sub: "副音声",
  },
  quality: {
    label: "画質",
  },
  player: {
    mute: "ミュート",
    unmute: "ミュート解除",
    volume: "音量",
    fullscreen: "フルスクリーン",
    exitFullscreen: "フルスクリーン解除",
  },
  error: {
    title: "受信エラーが発生しました",
    description:
      "番組の信号を受信できませんでした。アンテナの接続状況や受信環境をご確認ください。",
    code: "エラーコード: {{detail}}",
    retry: "再試行",
    mseNotSupported:
      "このブラウザは Media Source Extensions に対応していないため、再生できません。",
    playback: "再生中にエラーが発生しました。",
  },
};
