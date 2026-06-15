/**
 * Protobuf ワイヤーフォーマットの最小限のリーダ。
 *
 * NDGR (ニコ生新メッセージサーバー) の受信に必要な範囲だけを実装する。
 * スキーマ定義からのコード生成 (protobuf-es 等) は依存とビルド工程が重いため
 * 採用せず、必要なメッセージのフィールドだけを ndgr.ts で手動デコードする。
 * ワイヤーフォーマット仕様: https://protobuf.dev/programming-guides/encoding/
 */

/**
 * varint を 1 つ読む。値は 64bit を扱えるよう bigint で返す。
 * バッファ途中で切れている場合は例外を投げる。
 */
export function readVarint(
  buffer: Uint8Array,
  offset: number,
): { value: bigint; next: number } {
  let value = 0n;
  let shift = 0n;
  let position = offset;
  while (true) {
    if (position >= buffer.length) {
      throw new Error("truncated varint");
    }
    const byte = buffer[position];
    position += 1;
    value |= BigInt(byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) {
      return { value, next: position };
    }
    shift += 7n;
    if (shift > 63n) {
      throw new Error("varint too long");
    }
  }
}

export type WireField = {
  fieldNo: number;
  wireType: number;
  /** wire type 0 (VARINT) の値。 */
  varint?: bigint;
  /** wire type 2 (LEN) のペイロード。 */
  bytes?: Uint8Array;
};

/**
 * メッセージのフィールドを列挙する。VARINT と LEN のみ値を保持し、
 * I32 / I64 は読み飛ばす (NDGR のデコードに不要)。
 */
export function fieldsOf(message: Uint8Array): WireField[] {
  const fields: WireField[] = [];
  let offset = 0;
  while (offset < message.length) {
    const tag = readVarint(message, offset);
    offset = tag.next;
    const fieldNo = Number(tag.value >> 3n);
    const wireType = Number(tag.value & 0x7n);
    switch (wireType) {
      case 0: {
        const v = readVarint(message, offset);
        offset = v.next;
        fields.push({ fieldNo, wireType, varint: v.value });
        break;
      }
      case 1: {
        offset += 8;
        break;
      }
      case 2: {
        const len = readVarint(message, offset);
        const start = len.next;
        const end = start + Number(len.value);
        if (end > message.length) {
          throw new Error("truncated length-delimited field");
        }
        offset = end;
        fields.push({ fieldNo, wireType, bytes: message.subarray(start, end) });
        break;
      }
      case 5: {
        offset += 4;
        break;
      }
      default:
        throw new Error(`unsupported wire type: ${wireType}`);
    }
    if (offset > message.length) {
      throw new Error("truncated field");
    }
  }
  return fields;
}

/**
 * varint 長プレフィックス付きで連結された Protobuf メッセージのストリームを
 * 1 メッセージずつ切り出す (NDGR の View / Segment API のレスポンス形式)。
 * チャンク境界がプレフィックスや本体の途中でも復元する。
 */
export async function* lengthDelimited(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<Uint8Array> {
  const reader = stream.getReader();
  let buffer: Uint8Array<ArrayBufferLike> = new Uint8Array(0);
  let done = false;
  try {
    while (true) {
      // バッファ先頭から取り出せるだけメッセージを切り出す。
      while (buffer.length > 0) {
        let length: { value: bigint; next: number };
        try {
          length = readVarint(buffer, 0);
        } catch {
          break; // プレフィックスが揃っていない
        }
        const end = length.next + Number(length.value);
        if (end > buffer.length) {
          break; // 本体が揃っていない
        }
        yield buffer.slice(length.next, end);
        buffer = buffer.subarray(end);
      }
      if (done) {
        if (buffer.length > 0) {
          throw new Error("stream ended in the middle of a message");
        }
        return;
      }
      const result = await reader.read();
      if (result.done) {
        done = true;
        continue;
      }
      if (buffer.length === 0) {
        buffer = result.value;
      } else {
        const merged = new Uint8Array(buffer.length + result.value.length);
        merged.set(buffer);
        merged.set(result.value, buffer.length);
        buffer = merged;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
