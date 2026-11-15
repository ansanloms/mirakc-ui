import assert from "node:assert/strict";
import { test } from "node:test";
import { buildVideoEncoderArgs, qualitySettings } from "./encoder.ts";
import { qualities } from "./quality.ts";

test("buildVideoEncoderArgs: libx264 は低遅延プリセットを含む", () => {
  const args = buildVideoEncoderArgs("libx264", "2000k");
  assert.deepStrictEqual(args.includes("libx264"), true);
  // -preset ultrafast / -tune zerolatency が CPU エンコードの低遅延の肝。
  assert.deepStrictEqual(args[args.indexOf("-preset") + 1], "ultrafast");
  assert.deepStrictEqual(args[args.indexOf("-tune") + 1], "zerolatency");
  assert.deepStrictEqual(args[args.indexOf("-b:v") + 1], "2000k");
});

test("buildVideoEncoderArgs: h264_v4l2m2m は HW 向けの最小引数", () => {
  const args = buildVideoEncoderArgs("h264_v4l2m2m", "3500k");
  assert.deepStrictEqual(args.includes("h264_v4l2m2m"), true);
  // ソフトウェア専用の preset/tune は付けない。
  assert.deepStrictEqual(args.includes("-preset"), false);
  assert.deepStrictEqual(args.includes("-tune"), false);
  assert.deepStrictEqual(args[args.indexOf("-b:v") + 1], "3500k");
});

test("qualitySettings: 各画質に scale と bitrate が定義されている", () => {
  for (const q of qualities) {
    assert.deepStrictEqual(typeof qualitySettings[q].scale, "string");
    assert.deepStrictEqual(typeof qualitySettings[q].bitrate, "string");
  }
});
