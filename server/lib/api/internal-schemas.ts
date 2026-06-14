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
  "NotificationSettings": {
    "type": "object",
    "additionalProperties": false,
    "description": "ntfy への録画イベント通知の設定。\n\n各イベントのトグルが 1 つでも有効な場合は `url` が必須となる。\n",
    "required": [
      "url",
      "token",
      "onSchedule",
      "onStart",
      "onEnd",
      "onFail",
      "onRemove"
    ],
    "properties": {
      "url": {
        "type": "string",
        "description": "トピックまで含む ntfy の URL。",
        "example": "https://ntfy.sh/mirakc-rec"
      },
      "token": {
        "type": "string",
        "description": "アクセストークン。空文字は未設定を表す。Authorization ヘッダの Bearer として送信する。"
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
  "NotificationTestRequest": {
    "type": "object",
    "description": "テスト通知の送信先。\n\n保存前の入力値をそのまま受け取り、実際に ntfy へ送信する。\n",
    "required": [
      "url",
      "token"
    ],
    "properties": {
      "url": {
        "type": "string",
        "description": "トピックまで含む ntfy の URL。",
        "example": "https://ntfy.sh/mirakc-rec"
      },
      "token": {
        "type": "string",
        "description": "アクセストークン。空文字は未設定を表す。Authorization ヘッダの Bearer として送信する。"
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
  "ChannelMapping": {
    "type": "object",
    "additionalProperties": false,
    "description": "取得元のチャンネルへの割り当て 1 件。\n\nmirakc の複合サービス ID と、取得元 (ニコニコ実況 / NX-Jikkyo) のチャンネル ID を対応づける。`enabled` が false の行は下書きとして保存されるが、コメント解決の対象にはならない。\n",
    "required": [
      "serviceId",
      "channelId",
      "enabled"
    ],
    "properties": {
      "serviceId": {
        "type": "integer",
        "description": "mirakc (Mirakurun) の複合サービス ID。",
        "example": 3273601024
      },
      "channelId": {
        "type": "string",
        "description": "取得元のチャンネル ID。nicolive は `ch` 始まり、nx-jikkyo は `jk` 始まり。",
        "example": "jk101"
      },
      "enabled": {
        "type": "boolean",
        "description": "有効な割り当てか。無効な行は保存されるが、コメント解決と検証の対象から外れる。"
      }
    }
  },
  "LiveCommentSettings": {
    "type": "object",
    "additionalProperties": false,
    "description": "実況コメントの取得元ごとのチャンネル割り当て。\n\n取得元 (`nicolive` / `nx-jikkyo`) ごとに、mirakc のサービスとチャンネル ID の割り当てを配列で持つ。同一サービスを複数の取得元に割り当ててよい。\n",
    "required": [
      "nicolive",
      "nx-jikkyo"
    ],
    "properties": {
      "nicolive": {
        "type": "array",
        "description": "ニコニコ実況の割り当て一覧。",
        "items": {
          "type": "object",
          "additionalProperties": false,
          "description": "取得元のチャンネルへの割り当て 1 件。\n\nmirakc の複合サービス ID と、取得元 (ニコニコ実況 / NX-Jikkyo) のチャンネル ID を対応づける。`enabled` が false の行は下書きとして保存されるが、コメント解決の対象にはならない。\n",
          "required": [
            "serviceId",
            "channelId",
            "enabled"
          ],
          "properties": {
            "serviceId": {
              "type": "integer",
              "description": "mirakc (Mirakurun) の複合サービス ID。",
              "example": 3273601024
            },
            "channelId": {
              "type": "string",
              "description": "取得元のチャンネル ID。nicolive は `ch` 始まり、nx-jikkyo は `jk` 始まり。",
              "example": "jk101"
            },
            "enabled": {
              "type": "boolean",
              "description": "有効な割り当てか。無効な行は保存されるが、コメント解決と検証の対象から外れる。"
            }
          }
        }
      },
      "nx-jikkyo": {
        "type": "array",
        "description": "NX-Jikkyo の割り当て一覧。",
        "items": {
          "type": "object",
          "additionalProperties": false,
          "description": "取得元のチャンネルへの割り当て 1 件。\n\nmirakc の複合サービス ID と、取得元 (ニコニコ実況 / NX-Jikkyo) のチャンネル ID を対応づける。`enabled` が false の行は下書きとして保存されるが、コメント解決の対象にはならない。\n",
          "required": [
            "serviceId",
            "channelId",
            "enabled"
          ],
          "properties": {
            "serviceId": {
              "type": "integer",
              "description": "mirakc (Mirakurun) の複合サービス ID。",
              "example": 3273601024
            },
            "channelId": {
              "type": "string",
              "description": "取得元のチャンネル ID。nicolive は `ch` 始まり、nx-jikkyo は `jk` 始まり。",
              "example": "jk101"
            },
            "enabled": {
              "type": "boolean",
              "description": "有効な割り当てか。無効な行は保存されるが、コメント解決と検証の対象から外れる。"
            }
          }
        }
      }
    }
  },
  "LiveCommentSettingsView": {
    "type": "object",
    "additionalProperties": false,
    "description": "実況コメント設定の取得応答。\n\n保存済みの割り当てに加え、フォームの自動補完に使う候補を含む。未保存の場合は組み込みの対照表から導出した既定値を返す。\n",
    "required": [
      "saved",
      "channels",
      "suggestions"
    ],
    "properties": {
      "saved": {
        "type": "boolean",
        "description": "保存済みか。false の場合は channels が組み込み対照表からの既定値であることを表す。"
      },
      "channels": {
        "type": "object",
        "additionalProperties": false,
        "description": "実況コメントの取得元ごとのチャンネル割り当て。\n\n取得元 (`nicolive` / `nx-jikkyo`) ごとに、mirakc のサービスとチャンネル ID の割り当てを配列で持つ。同一サービスを複数の取得元に割り当ててよい。\n",
        "required": [
          "nicolive",
          "nx-jikkyo"
        ],
        "properties": {
          "nicolive": {
            "type": "array",
            "description": "ニコニコ実況の割り当て一覧。",
            "items": {
              "type": "object",
              "additionalProperties": false,
              "description": "取得元のチャンネルへの割り当て 1 件。\n\nmirakc の複合サービス ID と、取得元 (ニコニコ実況 / NX-Jikkyo) のチャンネル ID を対応づける。`enabled` が false の行は下書きとして保存されるが、コメント解決の対象にはならない。\n",
              "required": [
                "serviceId",
                "channelId",
                "enabled"
              ],
              "properties": {
                "serviceId": {
                  "type": "integer",
                  "description": "mirakc (Mirakurun) の複合サービス ID。",
                  "example": 3273601024
                },
                "channelId": {
                  "type": "string",
                  "description": "取得元のチャンネル ID。nicolive は `ch` 始まり、nx-jikkyo は `jk` 始まり。",
                  "example": "jk101"
                },
                "enabled": {
                  "type": "boolean",
                  "description": "有効な割り当てか。無効な行は保存されるが、コメント解決と検証の対象から外れる。"
                }
              }
            }
          },
          "nx-jikkyo": {
            "type": "array",
            "description": "NX-Jikkyo の割り当て一覧。",
            "items": {
              "type": "object",
              "additionalProperties": false,
              "description": "取得元のチャンネルへの割り当て 1 件。\n\nmirakc の複合サービス ID と、取得元 (ニコニコ実況 / NX-Jikkyo) のチャンネル ID を対応づける。`enabled` が false の行は下書きとして保存されるが、コメント解決の対象にはならない。\n",
              "required": [
                "serviceId",
                "channelId",
                "enabled"
              ],
              "properties": {
                "serviceId": {
                  "type": "integer",
                  "description": "mirakc (Mirakurun) の複合サービス ID。",
                  "example": 3273601024
                },
                "channelId": {
                  "type": "string",
                  "description": "取得元のチャンネル ID。nicolive は `ch` 始まり、nx-jikkyo は `jk` 始まり。",
                  "example": "jk101"
                },
                "enabled": {
                  "type": "boolean",
                  "description": "有効な割り当てか。無効な行は保存されるが、コメント解決と検証の対象から外れる。"
                }
              }
            }
          }
        }
      },
      "suggestions": {
        "type": "object",
        "additionalProperties": false,
        "description": "取得元ごとの自動補完候補。複合サービス ID (文字列) からチャンネル ID への対応。",
        "required": [
          "nicolive",
          "nx-jikkyo"
        ],
        "properties": {
          "nicolive": {
            "type": "object",
            "description": "ニコニコ実況の候補。複合サービス ID (文字列) から `ch` 始まりの ID への対応。",
            "additionalProperties": {
              "type": "string"
            }
          },
          "nx-jikkyo": {
            "type": "object",
            "description": "NX-Jikkyo の候補。複合サービス ID (文字列) から `jk` 始まりの ID への対応。",
            "additionalProperties": {
              "type": "string"
            }
          }
        }
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
