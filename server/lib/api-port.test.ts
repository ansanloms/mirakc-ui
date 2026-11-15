import assert from "node:assert/strict";
import { test } from "node:test";
import { apiPortOf } from "./api-port.ts";

test("apiPortOf: 未設定・空は 8000", () => {
  assert.deepStrictEqual(apiPortOf(undefined), 8000);
  assert.deepStrictEqual(apiPortOf(""), 8000);
});

test("apiPortOf: 非数値・非整数・範囲外は 8000", () => {
  assert.deepStrictEqual(apiPortOf("abc"), 8000);
  assert.deepStrictEqual(apiPortOf("0"), 8000);
  assert.deepStrictEqual(apiPortOf("65536"), 8000);
  assert.deepStrictEqual(apiPortOf("8000.5"), 8000);
});

test("apiPortOf: 前後の空白は無視して数値として読む", () => {
  assert.deepStrictEqual(apiPortOf(" 9000 "), 9000);
});

test("apiPortOf: 1〜65535 の整数はそのまま返す", () => {
  assert.deepStrictEqual(apiPortOf("9000"), 9000);
  assert.deepStrictEqual(apiPortOf("1"), 1);
  assert.deepStrictEqual(apiPortOf("65535"), 65535);
});
