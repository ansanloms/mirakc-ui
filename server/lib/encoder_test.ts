import { assertEquals } from "@std/assert";
import {
  buildVideoEncoderArgs,
  normalizeQuality,
  qualitySettings,
} from "./encoder.ts";

Deno.test("normalizeQuality: 既知の値はそのまま返す", () => {
  assertEquals(normalizeQuality("480p"), "480p");
  assertEquals(normalizeQuality("720p"), "720p");
  assertEquals(normalizeQuality("1024p"), "1024p");
});

Deno.test("normalizeQuality: 未知/空/null は 720p にフォールバック", () => {
  assertEquals(normalizeQuality(null), "720p");
  assertEquals(normalizeQuality(undefined), "720p");
  assertEquals(normalizeQuality(""), "720p");
  assertEquals(normalizeQuality("9999p"), "720p");
});

Deno.test("buildVideoEncoderArgs: libx264 は低遅延プリセットを含む", () => {
  const args = buildVideoEncoderArgs("libx264", "2000k");
  assertEquals(args.includes("libx264"), true);
  // -preset ultrafast / -tune zerolatency が CPU エンコードの低遅延の肝。
  assertEquals(args[args.indexOf("-preset") + 1], "ultrafast");
  assertEquals(args[args.indexOf("-tune") + 1], "zerolatency");
  assertEquals(args[args.indexOf("-b:v") + 1], "2000k");
});

Deno.test("buildVideoEncoderArgs: h264_v4l2m2m は HW 向けの最小引数", () => {
  const args = buildVideoEncoderArgs("h264_v4l2m2m", "3500k");
  assertEquals(args.includes("h264_v4l2m2m"), true);
  // ソフトウェア専用の preset/tune は付けない。
  assertEquals(args.includes("-preset"), false);
  assertEquals(args.includes("-tune"), false);
  assertEquals(args[args.indexOf("-b:v") + 1], "3500k");
});

Deno.test("qualitySettings: 各画質に scale と bitrate が定義されている", () => {
  for (const q of ["480p", "720p", "1024p"] as const) {
    assertEquals(typeof qualitySettings[q].scale, "string");
    assertEquals(typeof qualitySettings[q].bitrate, "string");
  }
});
