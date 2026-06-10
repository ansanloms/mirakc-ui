import { assertEquals } from "@std/assert";
import {
  defaultQuality,
  isQuality,
  normalizeQuality,
  qualities,
} from "./quality.ts";

Deno.test("qualities: 全プリセットを昇順に列挙する", () => {
  assertEquals(qualities, ["480p", "720p", "1024p"]);
});

Deno.test("isQuality: 既知の値だけ true", () => {
  for (const q of qualities) {
    assertEquals(isQuality(q), true);
  }
  assertEquals(isQuality("9999p"), false);
  assertEquals(isQuality(""), false);
  assertEquals(isQuality(null), false);
  assertEquals(isQuality(undefined), false);
  assertEquals(isQuality(720), false);
});

Deno.test("normalizeQuality: 既知の値はそのまま返す", () => {
  assertEquals(normalizeQuality("480p"), "480p");
  assertEquals(normalizeQuality("720p"), "720p");
  assertEquals(normalizeQuality("1024p"), "1024p");
});

Deno.test("normalizeQuality: 未知/空/null は defaultQuality にフォールバック", () => {
  assertEquals(normalizeQuality(null), defaultQuality);
  assertEquals(normalizeQuality(undefined), defaultQuality);
  assertEquals(normalizeQuality(""), defaultQuality);
  assertEquals(normalizeQuality("9999p"), defaultQuality);
});

Deno.test("normalizeQuality: フォールバック先を指定できる", () => {
  assertEquals(normalizeQuality("9999p", "480p"), "480p");
  assertEquals(normalizeQuality(undefined, "480p"), "480p");
  // 既知の値ならフォールバック指定は無視される。
  assertEquals(normalizeQuality("720p", "480p"), "720p");
});
