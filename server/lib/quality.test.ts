import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultQuality, isQuality, normalizeQuality, qualities } from "./quality.ts";

test("qualities: 全プリセットを昇順に列挙する", () => {
  assert.deepStrictEqual(qualities, ["480p", "720p", "1024p"]);
});

test("isQuality: 既知の値だけ true", () => {
  for (const q of qualities) {
    assert.deepStrictEqual(isQuality(q), true);
  }
  assert.deepStrictEqual(isQuality("9999p"), false);
  assert.deepStrictEqual(isQuality(""), false);
  assert.deepStrictEqual(isQuality(null), false);
  assert.deepStrictEqual(isQuality(undefined), false);
  assert.deepStrictEqual(isQuality(720), false);
});

test("normalizeQuality: 既知の値はそのまま返す", () => {
  assert.deepStrictEqual(normalizeQuality("480p"), "480p");
  assert.deepStrictEqual(normalizeQuality("720p"), "720p");
  assert.deepStrictEqual(normalizeQuality("1024p"), "1024p");
});

test("normalizeQuality: 未知/空/null は defaultQuality にフォールバック", () => {
  assert.deepStrictEqual(normalizeQuality(null), defaultQuality);
  assert.deepStrictEqual(normalizeQuality(undefined), defaultQuality);
  assert.deepStrictEqual(normalizeQuality(""), defaultQuality);
  assert.deepStrictEqual(normalizeQuality("9999p"), defaultQuality);
});

test("normalizeQuality: フォールバック先を指定できる", () => {
  assert.deepStrictEqual(normalizeQuality("9999p", "480p"), "480p");
  assert.deepStrictEqual(normalizeQuality(undefined, "480p"), "480p");
  // 既知の値ならフォールバック指定は無視される。
  assert.deepStrictEqual(normalizeQuality("720p", "480p"), "720p");
});
