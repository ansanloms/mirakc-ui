import assert from "node:assert/strict";
import { test } from "node:test";
import { mirakcApiUrlOf, mirakcEventsUrlOf } from "./mirakc.ts";

test("mirakcApiUrlOf: ベース URL から /api を組み立てる", () => {
  assert.deepStrictEqual(
    mirakcApiUrlOf("http://mirakc:40772"),
    "http://mirakc:40772/api",
  );
  assert.deepStrictEqual(
    mirakcApiUrlOf("http://mirakc:40772/"),
    "http://mirakc:40772/api",
  );
  // サブパス配下のリバースプロキシ。
  assert.deepStrictEqual(
    mirakcApiUrlOf("https://example.com/mirakc"),
    "https://example.com/mirakc/api",
  );
});

test("mirakcEventsUrlOf: ベース URL から /events を組み立てる", () => {
  assert.deepStrictEqual(
    mirakcEventsUrlOf("http://mirakc:40772"),
    "http://mirakc:40772/events",
  );
  assert.deepStrictEqual(
    mirakcEventsUrlOf("http://mirakc:40772/"),
    "http://mirakc:40772/events",
  );
});
