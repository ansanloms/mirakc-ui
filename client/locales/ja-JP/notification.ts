export default {
  title: "通知設定",
  subtitle: "録画イベントを ntfy.sh で通知します",
  lead:
    "録画の開始・終了を ntfy.sh のトピックへ送信します。スマートフォンの ntfy アプリで同じトピックを購読すると、プッシュ通知として受け取れます。",
  loading: "通知設定を読み込んでいます",
  settings: "設定へ",
  epg: "番組表へ",
  server: {
    title: "ntfy.sh サーバー",
    description: "通知の送信先トピックと認証情報",
    url: "NTFY の URL",
    urlPlaceholder: "https://ntfy.sh/mirakc-rec",
    urlHint: "トピック名まで含めた公開 URL を入力します",
    urlInvalid: "http(s) で始まる URL を入力してください",
    urlRequired: "通知を送信するには URL が必要です",
    token: "NTFY の TOKEN",
    tokenPlaceholder: "tk_xxxxxxxxxxxxxxxx",
    tokenHint:
      "アクセス制限のあるトピックの場合に設定します（Authorization: Bearer として送信）",
    showToken: "トークンを表示",
    hideToken: "トークンを隠す",
    test: "テスト通知を送信",
    optional: "任意",
  },
  events: {
    title: "通知先",
    description: "通知を受け取る録画イベント",
    items: {
      onSchedule: {
        label: "録画登録",
        description: "録画予約が登録されたときに通知します",
      },
      onStart: {
        label: "録画開始",
        description: "録画が始まったときに通知します",
      },
      onEnd: {
        label: "録画終了",
        description: "録画が完了したときに通知します",
      },
      onFail: {
        label: "録画失敗",
        description: "録画に失敗したときに通知します",
      },
      onRemove: {
        label: "録画削除",
        description: "録画予約が削除されたときに通知します",
      },
    },
    none: "すべてオフの場合、通知は送信されません。",
  },
  save: "保存する",
  dirty: "未保存の変更があります",
  toast: {
    saved: "通知設定を保存しました",
    saveFailed: "通知設定の保存に失敗しました",
    testSent: "テスト通知を送信しました",
    testFailed: "テスト通知の送信に失敗しました",
  },
};
