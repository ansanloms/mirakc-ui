export default {
  title: "視聴",
  watch: "視聴する",
  selectService: "チャンネルを選択してください",
  caption: {
    show: "字幕 ON",
    hide: "字幕 OFF",
  },
  audio: {
    main: "主音声",
    sub: "副音声",
  },
  quality: {
    label: "画質",
  },
  channelType: {
    GR: "地デジ",
    BS: "BS",
    CS: "CS",
    SKY: "スカパー！",
  },
  error: {
    mseNotSupported:
      "このブラウザは Media Source Extensions に対応していないため、再生できません。",
    playback: "再生中にエラーが発生しました。",
  },
  notice: {
    streamUnderDevelopment:
      "映像のトランスコード層は別 PR で実装中です。現状は mirakc の生ストリーム (MPEG-2 Video) のため映像は再生できません。字幕データは表示される場合があります。",
  },
};
