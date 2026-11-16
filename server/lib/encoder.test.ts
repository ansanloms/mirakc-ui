import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildHwDeviceArgs,
  buildVideoEncoderArgs,
  buildVideoFilter,
  encoderOrder,
  isKnownEncoder,
  qualitySettings,
  resolveEncoderCandidates,
} from "./encoder.ts";
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

test("buildVideoEncoderArgs: h264_vaapi は B フレームを切り preset/tune を付けない", () => {
  const args = buildVideoEncoderArgs("h264_vaapi", "3500k");
  assert.deepStrictEqual(args.includes("h264_vaapi"), true);
  assert.deepStrictEqual(args[args.indexOf("-b:v") + 1], "3500k");
  // h264_vaapi の既定は bf=2。低遅延のため B フレームを切る。
  assert.deepStrictEqual(args[args.indexOf("-bf") + 1], "0");
  assert.deepStrictEqual(args.includes("-preset"), false);
  assert.deepStrictEqual(args.includes("-tune"), false);
});

test("buildHwDeviceArgs: h264_vaapi だけがデバイスを指定する", () => {
  assert.deepStrictEqual(buildHwDeviceArgs("h264_vaapi"), ["-vaapi_device", "/dev/dri/renderD128"]);
  assert.deepStrictEqual(buildHwDeviceArgs("libx264"), []);
  assert.deepStrictEqual(buildHwDeviceArgs("h264_v4l2m2m"), []);
});

test("buildVideoFilter: エンコーダごとのフィルタ列", () => {
  const base = "yadif=mode=0:parity=-1:deint=1,scale=-2:720";
  assert.deepStrictEqual(buildVideoFilter("libx264", "-2:720"), base);
  assert.deepStrictEqual(buildVideoFilter("h264_v4l2m2m", "-2:720"), `${base},format=yuv420p`);
  assert.deepStrictEqual(buildVideoFilter("h264_vaapi", "-2:720"), `${base},format=nv12,hwupload`);
});

test("resolveEncoderCandidates: 未設定・空文字・未知の値は自動検出の順序", () => {
  const auto = ["h264_vaapi", "h264_v4l2m2m", "libx264"];
  assert.deepStrictEqual(resolveEncoderCandidates(undefined), auto);
  assert.deepStrictEqual(resolveEncoderCandidates(""), auto);
  assert.deepStrictEqual(resolveEncoderCandidates("nvenc"), auto);
});

test("resolveEncoderCandidates: 既知の値はそれ 1 つだけ", () => {
  assert.deepStrictEqual(resolveEncoderCandidates("h264_vaapi"), ["h264_vaapi"]);
  assert.deepStrictEqual(resolveEncoderCandidates("h264_v4l2m2m"), ["h264_v4l2m2m"]);
  assert.deepStrictEqual(resolveEncoderCandidates("libx264"), ["libx264"]);
});

test("resolveEncoderCandidates: 大文字・前後の空白を正規化して比較する", () => {
  assert.deepStrictEqual(resolveEncoderCandidates("H264_VAAPI"), ["h264_vaapi"]);
  assert.deepStrictEqual(resolveEncoderCandidates(" h264_vaapi "), ["h264_vaapi"]);
  assert.deepStrictEqual(resolveEncoderCandidates("LibX264"), ["libx264"]);
});

test("resolveEncoderCandidates: 空白のみは未設定と同じ", () => {
  assert.deepStrictEqual(resolveEncoderCandidates("   "), [
    "h264_vaapi",
    "h264_v4l2m2m",
    "libx264",
  ]);
});

test("isKnownEncoder: 正規化後に既知のエンコーダ名か判定する", () => {
  assert.deepStrictEqual(isKnownEncoder("libx264"), true);
  assert.deepStrictEqual(isKnownEncoder(" H264_VAAPI "), true);
  assert.deepStrictEqual(isKnownEncoder("nvenc"), false);
  assert.deepStrictEqual(isKnownEncoder("   "), false);
});

test("encoderOrder: 自動検出の順序は h264_vaapi → h264_v4l2m2m → libx264 で重複が無い", () => {
  assert.deepStrictEqual([...encoderOrder], ["h264_vaapi", "h264_v4l2m2m", "libx264"]);
  assert.deepStrictEqual(new Set(encoderOrder).size, encoderOrder.length);
});

test("qualitySettings: 各画質に scale と bitrate が定義されている", () => {
  for (const q of qualities) {
    assert.deepStrictEqual(typeof qualitySettings[q].scale, "string");
    assert.deepStrictEqual(typeof qualitySettings[q].bitrate, "string");
  }
});
