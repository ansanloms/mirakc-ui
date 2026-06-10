import { assertEquals } from "@std/assert";
import { buildVideoEncoderArgs, qualitySettings } from "./encoder.ts";
import { qualities } from "./quality.ts";

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
  for (const q of qualities) {
    assertEquals(typeof qualitySettings[q].scale, "string");
    assertEquals(typeof qualitySettings[q].bitrate, "string");
  }
});
