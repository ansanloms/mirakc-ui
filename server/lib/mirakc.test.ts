import { assertEquals } from "@std/assert";
import { mirakcApiUrlOf, mirakcEventsUrlOf } from "./mirakc.ts";

Deno.test("mirakcApiUrlOf: ベース URL から /api を組み立てる", () => {
  assertEquals(
    mirakcApiUrlOf("http://mirakc:40772"),
    "http://mirakc:40772/api",
  );
  assertEquals(
    mirakcApiUrlOf("http://mirakc:40772/"),
    "http://mirakc:40772/api",
  );
  // サブパス配下のリバースプロキシ。
  assertEquals(
    mirakcApiUrlOf("https://example.com/mirakc"),
    "https://example.com/mirakc/api",
  );
});

Deno.test("mirakcEventsUrlOf: ベース URL から /events を組み立てる", () => {
  assertEquals(
    mirakcEventsUrlOf("http://mirakc:40772"),
    "http://mirakc:40772/events",
  );
  assertEquals(
    mirakcEventsUrlOf("http://mirakc:40772/"),
    "http://mirakc:40772/events",
  );
});
