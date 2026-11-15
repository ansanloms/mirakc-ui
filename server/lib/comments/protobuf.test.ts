import assert from "node:assert/strict";
import { test } from "node:test";
import { fieldsOf, lengthDelimited, readVarint } from "./protobuf.ts";

/** テスト用の varint エンコード。 */
function varint(value: number | bigint): number[] {
  let v = BigInt(value);
  const bytes: number[] = [];
  while (v >= 0x80n) {
    bytes.push(Number(v & 0x7fn) | 0x80);
    v >>= 7n;
  }
  bytes.push(Number(v));
  return bytes;
}

/** テスト用: フィールド番号 + LEN 型 (wire type 2) のフィールドを組み立てる。 */
function lenField(fieldNo: number, payload: number[]): number[] {
  return [...varint((fieldNo << 3) | 2), ...varint(payload.length), ...payload];
}

/** テスト用: フィールド番号 + VARINT 型 (wire type 0) のフィールド。 */
function varintField(fieldNo: number, value: number | bigint): number[] {
  return [...varint(fieldNo << 3), ...varint(value)];
}

test("readVarint: 1 バイト値", () => {
  const { value, next } = readVarint(new Uint8Array([0x08]), 0);
  assert.deepStrictEqual(value, 8n);
  assert.deepStrictEqual(next, 1);
});

test("readVarint: 複数バイト値 (300)", () => {
  const { value, next } = readVarint(new Uint8Array([0xac, 0x02]), 0);
  assert.deepStrictEqual(value, 300n);
  assert.deepStrictEqual(next, 2);
});

test("readVarint: 途中で切れていたら例外", () => {
  assert.throws(() => readVarint(new Uint8Array([0x80]), 0));
});

test("fieldsOf: varint / LEN フィールドを列挙する", () => {
  const message = new Uint8Array([
    ...varintField(1, 150),
    ...lenField(2, [...new TextEncoder().encode("abc")]),
  ]);
  const fields = fieldsOf(message);
  assert.deepStrictEqual(fields.length, 2);
  assert.deepStrictEqual(fields[0], { fieldNo: 1, wireType: 0, varint: 150n });
  assert.deepStrictEqual(fields[1].fieldNo, 2);
  assert.deepStrictEqual(fields[1].wireType, 2);
  assert.deepStrictEqual(new TextDecoder().decode(fields[1].bytes), "abc");
});

test("fieldsOf: I32 / I64 フィールドは読み飛ばして後続を返す", () => {
  const message = new Uint8Array([
    // field 1, wire type 1 (I64)
    (1 << 3) | 1,
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    // field 2, wire type 5 (I32)
    (2 << 3) | 5,
    1,
    2,
    3,
    4,
    ...varintField(3, 7),
  ]);
  const fields = fieldsOf(message);
  assert.deepStrictEqual(fields.length, 1);
  assert.deepStrictEqual(fields[0], { fieldNo: 3, wireType: 0, varint: 7n });
});

function streamOf(chunks: number[][]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(new Uint8Array(chunk));
      }
      controller.close();
    },
  });
}

test("lengthDelimited: 1 チャンクに複数メッセージ", async () => {
  const a = [1, 2, 3];
  const b = [4, 5];
  const stream = streamOf([[...varint(3), ...a, ...varint(2), ...b]]);
  const messages: Uint8Array[] = [];
  for await (const message of lengthDelimited(stream)) {
    messages.push(message);
  }
  assert.deepStrictEqual(messages, [new Uint8Array(a), new Uint8Array(b)]);
});

test("lengthDelimited: メッセージ本体・長さプレフィックスがチャンク境界をまたぐ", async () => {
  const payload = [9, 8, 7, 6, 5, 4, 3, 2, 1, 0];
  const encoded = [...varint(payload.length), ...payload];
  // 長さプレフィックスの直後・本体の途中で分割する。
  const stream = streamOf([
    encoded.slice(0, 1),
    encoded.slice(1, 4),
    encoded.slice(4),
  ]);
  const messages: Uint8Array[] = [];
  for await (const message of lengthDelimited(stream)) {
    messages.push(message);
  }
  assert.deepStrictEqual(messages, [new Uint8Array(payload)]);
});

test("lengthDelimited: メッセージ途中でストリームが終わったら例外", async () => {
  const stream = streamOf([[...varint(5), 1, 2]]);
  let error: unknown = null;
  try {
    for await (const _ of lengthDelimited(stream)) {
      // 消費のみ
    }
  } catch (e) {
    error = e;
  }
  assert.deepStrictEqual(error instanceof Error, true);
});
