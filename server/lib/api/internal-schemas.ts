// This file was auto-generated from the OpenAPI definition in docs/api.
// Do not make direct changes to the file. Run `deno task generate:internal`.
//
// docs/api の component schema (= JSON Schema)。サーバはこれ 1 枚から
// 型 (json-schema-to-ts の FromSchema) と検証 (@cfworker/json-schema) を得る。

export const internalSchemas = {
  "KeywordRule": {
    "type": "object",
    "additionalProperties": false,
    "description": "キーワード自動録画のルール。\n\n一致した未予約かつ将来の番組を定期ジョブが自動で予約する。\n",
    "required": [
      "id",
      "keyword",
      "channels",
      "genres",
      "enabled",
      "createdAt"
    ],
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid",
        "description": "ルールの識別子。"
      },
      "keyword": {
        "type": "string",
        "description": "番組名に対して部分一致させるキーワード。大文字小文字は区別しない。",
        "example": "大相撲"
      },
      "from": {
        "type": "string",
        "format": "date-time",
        "description": "期間の開始日時。RFC 3339 形式でタイムゾーンを含み、開始日の 00:00:00 を表す。未指定は無制限。",
        "example": "2026-01-01T00:00:00+09:00"
      },
      "to": {
        "type": "string",
        "format": "date-time",
        "description": "期間の終了日時。RFC 3339 形式でタイムゾーンを含み、終了日の 23:59:59 を表す。未指定は無制限。",
        "example": "2026-01-31T23:59:59+09:00"
      },
      "channels": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "description": "対象チャンネルの Mirakurun channel (MirakurunChannel.channel) の配列。空配列は全チャンネルを表す。チャンネル配下の全サービスを横断して対象にする。"
      },
      "genres": {
        "type": "array",
        "items": {
          "type": "integer",
          "minimum": 0,
          "maximum": 15
        },
        "description": "対象ジャンルの ARIB lv1 コード (0 から 15) の配列。空配列は全ジャンルを表す。"
      },
      "enabled": {
        "type": "boolean",
        "description": "有効か停止か。停止中は自動予約の対象から外れる。"
      },
      "createdAt": {
        "type": "integer",
        "format": "int64",
        "description": "登録日時。epoch ミリ秒。"
      }
    }
  },
  "KeywordRuleInput": {
    "type": "object",
    "additionalProperties": false,
    "description": "キーワード自動録画ルールの登録および更新の入力。\n\nサーバが採番する `id` と `createdAt` を除いた項目で構成する。\n",
    "required": [
      "keyword"
    ],
    "properties": {
      "keyword": {
        "type": "string",
        "description": "番組名に対して部分一致させるキーワード。大文字小文字は区別しない。",
        "example": "大相撲"
      },
      "from": {
        "type": "string",
        "format": "date-time",
        "description": "期間の開始日時。RFC 3339 形式でタイムゾーンを含み、開始日の 00:00:00 を表す。未指定は無制限。",
        "example": "2026-01-01T00:00:00+09:00"
      },
      "to": {
        "type": "string",
        "format": "date-time",
        "description": "期間の終了日時。RFC 3339 形式でタイムゾーンを含み、終了日の 23:59:59 を表す。未指定は無制限。",
        "example": "2026-01-31T23:59:59+09:00"
      },
      "channels": {
        "type": "array",
        "items": {
          "type": "string"
        },
        "default": [],
        "description": "対象チャンネルの Mirakurun channel (MirakurunChannel.channel) の配列。空配列または未指定は全チャンネルを表す。チャンネル配下の全サービスを横断して対象にする。"
      },
      "genres": {
        "type": "array",
        "items": {
          "type": "integer",
          "minimum": 0,
          "maximum": 15
        },
        "default": [],
        "description": "対象ジャンルの ARIB lv1 コード (0 から 15) の配列。空配列または未指定は全ジャンルを表す。"
      },
      "enabled": {
        "type": "boolean",
        "default": true,
        "description": "有効か停止か。停止中は自動予約の対象から外れる。未指定は有効。"
      }
    }
  },
  "LiveCommentAssignment": {
    "type": "object",
    "additionalProperties": false,
    "description": "実況コメントの取得元への割り当て 1 件。\n\n取得元 (ニコニコ実況 / NX-Jikkyo) と、その取得元での実況チャンネル ID を対応づける。\n",
    "required": [
      "source",
      "channelId"
    ],
    "properties": {
      "source": {
        "type": "string",
        "enum": [
          "nicolive",
          "nx-jikkyo"
        ],
        "description": "コメントの取得元。",
        "example": "nx-jikkyo"
      },
      "channelId": {
        "type": "string",
        "description": "取得元のチャンネル ID。nicolive は `ch` 始まり、nx-jikkyo は `jk` 始まり。",
        "example": "jk1"
      }
    }
  },
  "LiveCommentMapping": {
    "type": "object",
    "additionalProperties": false,
    "description": "実況コメントの 1 チャンネル分の割り当て。\n\nmirakc のチャンネル (MirakurunChannel.channel) に対し、取得元ごとの実況チャンネル ID を対応づける。1 つのチャンネルに複数の取得元・ID を割り当てられる。チャンネル配下の全サービスでこの割り当てを使う。\n",
    "required": [
      "id",
      "channel",
      "assignments",
      "enabled",
      "createdAt"
    ],
    "properties": {
      "id": {
        "type": "string",
        "format": "uuid",
        "description": "割り当ての識別子。"
      },
      "channel": {
        "type": "string",
        "description": "対象チャンネルの Mirakurun channel (MirakurunChannel.channel)。",
        "example": "27"
      },
      "assignments": {
        "type": "array",
        "items": {
          "type": "object",
          "additionalProperties": false,
          "description": "実況コメントの取得元への割り当て 1 件。\n\n取得元 (ニコニコ実況 / NX-Jikkyo) と、その取得元での実況チャンネル ID を対応づける。\n",
          "required": [
            "source",
            "channelId"
          ],
          "properties": {
            "source": {
              "type": "string",
              "enum": [
                "nicolive",
                "nx-jikkyo"
              ],
              "description": "コメントの取得元。",
              "example": "nx-jikkyo"
            },
            "channelId": {
              "type": "string",
              "description": "取得元のチャンネル ID。nicolive は `ch` 始まり、nx-jikkyo は `jk` 始まり。",
              "example": "jk1"
            }
          }
        },
        "description": "取得元ごとの実況チャンネル ID の割り当て。"
      },
      "enabled": {
        "type": "boolean",
        "description": "有効か停止か。停止中はコメント解決の対象から外れる。"
      },
      "createdAt": {
        "type": "integer",
        "format": "int64",
        "description": "登録日時。epoch ミリ秒。"
      }
    }
  },
  "LiveCommentMappingInput": {
    "type": "object",
    "additionalProperties": false,
    "description": "実況コメント割り当ての登録および更新の入力。\n\nサーバが採番する `id` と `createdAt` を除いた項目で構成する。\n",
    "required": [
      "channel"
    ],
    "properties": {
      "channel": {
        "type": "string",
        "description": "対象チャンネルの Mirakurun channel (MirakurunChannel.channel)。",
        "example": "27"
      },
      "assignments": {
        "type": "array",
        "items": {
          "type": "object",
          "additionalProperties": false,
          "description": "実況コメントの取得元への割り当て 1 件。\n\n取得元 (ニコニコ実況 / NX-Jikkyo) と、その取得元での実況チャンネル ID を対応づける。\n",
          "required": [
            "source",
            "channelId"
          ],
          "properties": {
            "source": {
              "type": "string",
              "enum": [
                "nicolive",
                "nx-jikkyo"
              ],
              "description": "コメントの取得元。",
              "example": "nx-jikkyo"
            },
            "channelId": {
              "type": "string",
              "description": "取得元のチャンネル ID。nicolive は `ch` 始まり、nx-jikkyo は `jk` 始まり。",
              "example": "jk1"
            }
          }
        },
        "default": [],
        "description": "取得元ごとの実況チャンネル ID の割り当て。1 つのチャンネルに複数の取得元・ID を割り当ててよい。空配列または未指定は割り当て無しを表す。"
      },
      "enabled": {
        "type": "boolean",
        "default": true,
        "description": "有効か停止か。停止中はコメント解決の対象から外れる。未指定は有効。"
      }
    }
  },
  "NotificationSettings": {
    "type": "object",
    "additionalProperties": false,
    "description": "ntfy / Discord への録画イベント通知の設定。\n\n各イベントのトグルが 1 つでも有効な場合は、通知先 (ntfy の `url` または Discord の `discordWebhookUrl`) の少なくとも一方が必須となる。\n",
    "required": [
      "url",
      "token",
      "discordWebhookUrl",
      "onSchedule",
      "onStart",
      "onEnd",
      "onFail",
      "onRemove"
    ],
    "properties": {
      "url": {
        "type": "string",
        "description": "通知先 ntfy のトピックまで含む URL。空文字は ntfy への通知を無効にすることを表す。",
        "example": "https://ntfy.sh/mirakc-rec"
      },
      "token": {
        "type": "string",
        "description": "ntfy のアクセストークン。空文字は未設定を表す。Authorization ヘッダの Bearer として送信する。"
      },
      "discordWebhookUrl": {
        "type": "string",
        "description": "通知先 Discord の Incoming Webhook URL。空文字は Discord への通知を無効にすることを表す。",
        "example": "https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz"
      },
      "onSchedule": {
        "type": "boolean",
        "description": "録画予約の登録 (キーワード自動録画と手動) を通知するか。"
      },
      "onStart": {
        "type": "boolean",
        "description": "録画開始を通知するか。"
      },
      "onEnd": {
        "type": "boolean",
        "description": "録画終了を通知するか。"
      },
      "onFail": {
        "type": "boolean",
        "description": "録画失敗を通知するか。"
      },
      "onRemove": {
        "type": "boolean",
        "description": "録画予約の削除を通知するか。"
      }
    }
  },
  "NotificationTestNtfyRequest": {
    "type": "object",
    "description": "ntfy へのテスト通知の送信先。\n\n保存前の入力値 (url / token) をそのまま受け取り、実際に ntfy へ送信する。\n",
    "required": [
      "url",
      "token"
    ],
    "properties": {
      "url": {
        "type": "string",
        "description": "通知先 ntfy のトピックまで含む URL。",
        "example": "https://ntfy.sh/mirakc-rec"
      },
      "token": {
        "type": "string",
        "description": "ntfy のアクセストークン。空文字は未設定を表す。Authorization ヘッダの Bearer として送信する。"
      }
    }
  },
  "NotificationTestDiscordRequest": {
    "type": "object",
    "description": "Discord へのテスト通知の送信先。\n\n保存前の入力値 (webhookUrl) をそのまま受け取り、実際に Discord の Webhook へ送信する。\n",
    "required": [
      "webhookUrl"
    ],
    "properties": {
      "webhookUrl": {
        "type": "string",
        "description": "通知先 Discord の Incoming Webhook URL。",
        "example": "https://discord.com/api/webhooks/123456789012345678/abcdefghijklmnopqrstuvwxyz"
      }
    }
  },
  "NotificationTestResponse": {
    "type": "object",
    "required": [
      "ok"
    ],
    "properties": {
      "ok": {
        "type": "boolean",
        "const": true,
        "description": "テスト通知の送信に成功したことを表す。"
      }
    }
  },
  "ResponseError": {
    "type": "object",
    "required": [
      "error"
    ],
    "properties": {
      "error": {
        "type": "string",
        "description": "エラーの内容を表すメッセージ。",
        "example": "keyword must be a non-empty string"
      }
    }
  }
} as const;
