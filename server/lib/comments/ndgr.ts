/**
 * NDGR (ニコ生新メッセージサーバー、2024/08 以降) のメッセージデコード。
 *
 * View / Segment API が返す length-delimited Protobuf のうち、実況コメントの
 * 受信に必要なフィールドだけを protobuf.ts のリーダで手動デコードする。
 *
 * フィールド番号の出典 (スキーマ定義、MIT):
 *   https://github.com/n-air-app/nicolive-comment-protobuf
 *   - proto/dwango/nicolive/chat/service/edge/payload.proto
 *     ChunkedEntry { segment=1, backward=2, previous=3, next=4 }
 *     MessageSegment { from=1, until=2, uri=3 }
 *     ChunkedEntry.ReadyForNext { at=1 }
 *     ChunkedMessage { meta=1, message=2, state=4, signal=5 }
 *     ChunkedMessage.Meta { id=1, at=2 }
 *   - proto/dwango/nicolive/chat/data/message.proto
 *     NicoliveMessage { chat=1, ..., overflowed_chat=20 }
 *   - proto/dwango/nicolive/chat/data/atoms.proto
 *     Chat { content=1, name=2, vpos=3, ... }
 *
 * プロトコルの流れの参考実装 (MIT): https://github.com/tsukumijima/NDGRClient
 */

import { fieldsOf, type WireField } from "./protobuf.ts";

const decoder = new TextDecoder();

function stringOf(field: WireField | undefined): string | undefined {
  return field?.bytes === undefined ? undefined : decoder.decode(field.bytes);
}

function findField(
  fields: WireField[],
  fieldNo: number,
): WireField | undefined {
  return fields.find((field) => field.fieldNo === fieldNo);
}

/** View API の ChunkedEntry のうちライブ受信に使う情報。 */
export type NdgrEntry = {
  /** 受信すべき Segment API の URI (segment エントリ)。 */
  segmentUri?: string;
  /** View API へ再接続する際のカーソル (epoch 秒、next エントリ)。 */
  nextAt?: number;
};

/**
 * ChunkedEntry をデコードする。ライブ受信に不要な backward / previous は
 * 無視する (過去ログ遡行用)。
 */
export function decodeChunkedEntry(bytes: Uint8Array): NdgrEntry {
  const entry: NdgrEntry = {};
  for (const field of fieldsOf(bytes)) {
    if (field.fieldNo === 1 && field.bytes !== undefined) {
      // segment: MessageSegment { uri = 3 }
      const uri = stringOf(findField(fieldsOf(field.bytes), 3));
      if (uri !== undefined) {
        entry.segmentUri = uri;
      }
    } else if (field.fieldNo === 4 && field.bytes !== undefined) {
      // next: ReadyForNext { at = 1 }
      const at = findField(fieldsOf(field.bytes), 1)?.varint;
      if (at !== undefined) {
        entry.nextAt = Number(at);
      }
    }
  }
  return entry;
}

/** Segment API の ChunkedMessage のうち実況コメントに使う情報。 */
export type NdgrMessage = {
  /** メッセージ ID (重複排除に使う)。 */
  id: string;
  /** 投稿時刻 (epoch ミリ秒)。 */
  atMs: number;
  /** コメント本文。chat 以外のメッセージ (運営情報等) では undefined。 */
  chat?: { content: string; name: string | undefined };
};

/** google.protobuf.Timestamp { seconds = 1, nanos = 2 } を epoch ms にする。 */
function epochMsOf(timestamp: Uint8Array): number {
  const fields = fieldsOf(timestamp);
  const seconds = findField(fields, 1)?.varint ?? 0n;
  const nanos = findField(fields, 2)?.varint ?? 0n;
  return Number(seconds) * 1000 + Math.floor(Number(nanos) / 1_000_000);
}

/**
 * ChunkedMessage をデコードする。meta (id / at) が無い場合は null。
 * NicoliveMessage のうち chat (=1) と overflowed_chat (=20) をコメントとして
 * 扱い、それ以外 (ギフト・運営通知等) は chat 無しで返す。
 */
export function decodeChunkedMessage(bytes: Uint8Array): NdgrMessage | null {
  const fields = fieldsOf(bytes);

  const metaBytes = findField(fields, 1)?.bytes;
  if (metaBytes === undefined) {
    return null;
  }
  const metaFields = fieldsOf(metaBytes);
  const id = stringOf(findField(metaFields, 1));
  const atBytes = findField(metaFields, 2)?.bytes;
  if (id === undefined || atBytes === undefined) {
    return null;
  }

  let chat: NdgrMessage["chat"];
  const messageBytes = findField(fields, 2)?.bytes;
  if (messageBytes !== undefined) {
    const messageFields = fieldsOf(messageBytes);
    const chatBytes =
      (findField(messageFields, 1) ?? findField(messageFields, 20))
        ?.bytes;
    if (chatBytes !== undefined) {
      const chatFields = fieldsOf(chatBytes);
      const content = stringOf(findField(chatFields, 1));
      if (content !== undefined) {
        chat = { content, name: stringOf(findField(chatFields, 2)) };
      }
    }
  }

  return { id, atMs: epochMsOf(atBytes), chat };
}
