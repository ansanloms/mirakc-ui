import { assertEquals } from "@std/assert";
import { jikkyoIdOf, nicoliveChannelIdOf } from "./jikkyo.ts";

Deno.test("jikkyoIdOf: 地上波はサービス ID のみで照合する (NHK総合・東京)", () => {
  // 実際の NID は 0x7880〜0x7fef の範囲。対照表の network_id は 15 固定。
  assertEquals(jikkyoIdOf(0x7fe0, 0x0400), "jk1");
});

Deno.test("jikkyoIdOf: 地上波サブチャンネルは SID-1 / SID-2 へフォールバックする", () => {
  // NHK総合2・東京 (SID 1025) → NHK総合1・東京 (SID 1024 = 0x0400)
  assertEquals(jikkyoIdOf(0x7fe0, 0x0401), "jk1");
  // NHKEテレ3東京 (SID 1034) → NHKEテレ1東京 (SID 1032 = 0x0408)
  assertEquals(jikkyoIdOf(0x7fe0, 0x040a), "jk2");
});

Deno.test("jikkyoIdOf: BS は NID + SID の完全一致で照合する", () => {
  assertEquals(jikkyoIdOf(4, 101), "jk101");
  assertEquals(jikkyoIdOf(4, 211), "jk211");
  // 地上波範囲外の NID では SID のみ照合をしない
  assertEquals(jikkyoIdOf(4, 0x0400), null);
});

Deno.test("jikkyoIdOf: jikkyo_id = -1 (実況チャンネル無し) は null", () => {
  // スターチャンネル2 など CS の -1 エントリ
  assertEquals(jikkyoIdOf(7, 354), null);
});

Deno.test("jikkyoIdOf: 対照表に無いチャンネルは null", () => {
  assertEquals(jikkyoIdOf(0x7fe0, 0xffff), null);
});

Deno.test("nicoliveChannelIdOf: ニコ生チャンネルが存在する実況チャンネル", () => {
  assertEquals(nicoliveChannelIdOf(0x7fe0, 0x0400), "ch2646436"); // jk1
  assertEquals(nicoliveChannelIdOf(4, 101), "ch2647992"); // jk101
});

Deno.test("nicoliveChannelIdOf: NX-Jikkyo 専用チャンネル (jk141 等) は null", () => {
  // BS日テレ (jk141) は本家ニコニコ実況に存在しない
  assertEquals(nicoliveChannelIdOf(4, 141), null);
});
