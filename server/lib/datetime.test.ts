import { assertEquals } from "@std/assert";
import {
  formatDisplayDateTime,
  formatDisplayTime,
  formatYmdHms,
} from "./datetime.ts";

// 2026-01-02T03:04:05+09:00
const epochMs = Date.UTC(2026, 0, 1, 18, 4, 5);

Deno.test("formatYmdHms: ゼロ埋めの YYYYMMDDhhmmss を返す", () => {
  assertEquals(formatYmdHms(epochMs, "Asia/Tokyo"), "20260102030405");
});

Deno.test("formatDisplayDateTime: 人間可読の日時を返す", () => {
  assertEquals(
    formatDisplayDateTime(epochMs, "Asia/Tokyo"),
    "2026/01/02 03:04",
  );
});

Deno.test("formatDisplayTime: 時刻のみを返す", () => {
  assertEquals(formatDisplayTime(epochMs, "Asia/Tokyo"), "03:04");
});
