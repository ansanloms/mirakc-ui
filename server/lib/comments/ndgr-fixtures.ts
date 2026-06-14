/**
 * テスト用の NDGR メッセージ (Protobuf バイナリ) 組み立てヘルパ。
 * ndgr.test.ts / sources/nicolive.test.ts から使う。プロダクションコードでは
 * 使わない (エンコードは送信しないため不要)。
 */

/** varint エンコード。 */
export function varint(value: number | bigint): number[] {
  let v = BigInt(value);
  const bytes: number[] = [];
  while (v >= 0x80n) {
    bytes.push(Number(v & 0x7fn) | 0x80);
    v >>= 7n;
  }
  bytes.push(Number(v));
  return bytes;
}

/** フィールド番号 + LEN 型 (wire type 2) のフィールド。 */
export function lenField(fieldNo: number, payload: number[]): number[] {
  return [...varint((fieldNo << 3) | 2), ...varint(payload.length), ...payload];
}

/** フィールド番号 + VARINT 型 (wire type 0) のフィールド。 */
export function varintField(fieldNo: number, value: number | bigint): number[] {
  return [...varint(fieldNo << 3), ...varint(value)];
}

/** 文字列フィールド。 */
export function stringField(fieldNo: number, value: string): number[] {
  return lenField(fieldNo, [...new TextEncoder().encode(value)]);
}

/** varint 長プレフィックスを付けてメッセージを連結する (View / Segment の応答形式)。 */
export function lengthDelimitedOf(
  messages: number[][],
): Uint8Array<ArrayBuffer> {
  return new Uint8Array(
    messages.flatMap((message) => [...varint(message.length), ...message]),
  );
}

/** ChunkedEntry { segment(1): MessageSegment { uri(3) } } */
export function segmentEntryOf(uri: string): number[] {
  return lenField(1, stringField(3, uri));
}

/** ChunkedEntry { next(4): ReadyForNext { at(1) } } */
export function nextEntryOf(atSeconds: number): number[] {
  return lenField(4, varintField(1, atSeconds));
}

/** ChunkedMessage { meta(1): { id(1), at(2) }, message(2): { chat(1): { content(1), name(2)? } } } */
export function chatMessageOf(options: {
  id: string;
  atSeconds: number;
  atNanos?: number;
  content?: string;
  name?: string;
  /** chat のフィールド番号 (既定 1。overflowed_chat は 20)。 */
  chatFieldNo?: number;
}): number[] {
  const meta = [
    ...stringField(1, options.id),
    ...lenField(2, [
      ...varintField(1, options.atSeconds),
      ...(options.atNanos === undefined ? [] : varintField(2, options.atNanos)),
    ]),
  ];
  const chat = options.content === undefined ? null : [
    ...stringField(1, options.content),
    ...(options.name === undefined ? [] : stringField(2, options.name)),
    ...varintField(3, 100), // vpos (実データに倣い含めるが使わない)
  ];
  return [
    ...lenField(1, meta),
    ...(chat === null
      ? []
      : lenField(2, lenField(options.chatFieldNo ?? 1, chat))),
  ];
}
