/**
 * H.264 エンコーダの検出とトランスコード用の ffmpeg 引数生成。
 *
 * `ffmpeg -encoders` の文字列一致はデバイス有無を判定できず誤検出するため
 * (Debian の ffmpeg pkg は h264_v4l2m2m をビルド済みだが /dev/video* が無いと
 * 使えない)、実エンコードテスト (probe) で検証する。
 */

import { spawn } from "node:child_process";
import { Readable } from "node:stream";
import type { Quality } from "./quality.ts";

export type EncoderName = "h264_vaapi" | "h264_v4l2m2m" | "libx264";

/**
 * VAAPI のデバイス (コンテナ内のパス)。ホスト側の対応付けは
 * `--device <ホスト側パス>:/dev/dri/renderD128` で吸収する。
 */
const VAAPI_DEVICE = "/dev/dri/renderD128";

export const qualitySettings: Record<Quality, { scale: string; bitrate: string }> = {
  "480p": { scale: "-2:480", bitrate: "1000k" },
  "720p": { scale: "-2:720", bitrate: "2000k" },
  "1080p": { scale: "-2:1080", bitrate: "3500k" },
};

type EncoderDefinition = {
  /** ffmpeg の入力 (`-i`) より前に置くデバイス引数。 */
  hwDeviceArgs: string[];
  /** `-vf` のフィルタ列 (デインターレース・スケール) の末尾に足す文字列。 */
  filterSuffix: string;
  /** bitrate からエンコーダ引数を作る。 */
  encoderArgs: (bitrate: string) => string[];
};

/** エンコーダごとの定義。`Record` なので `EncoderName` を足すと定義漏れが型エラーになる。 */
const encoders: Record<EncoderName, EncoderDefinition> = {
  h264_vaapi: {
    hwDeviceArgs: ["-vaapi_device", VAAPI_DEVICE],
    filterSuffix: ",format=nv12,hwupload",
    // h264_vaapi の既定は bf=2。低遅延のため B フレームを切る。
    encoderArgs: (bitrate) => ["-c:v", "h264_vaapi", "-b:v", bitrate, "-g", "15", "-bf", "0"],
  },
  h264_v4l2m2m: {
    hwDeviceArgs: [],
    filterSuffix: ",format=yuv420p",
    encoderArgs: (bitrate) => ["-c:v", "h264_v4l2m2m", "-b:v", bitrate, "-g", "15"],
  },
  libx264: {
    hwDeviceArgs: [],
    filterSuffix: "",
    encoderArgs: (bitrate) => [
      "-c:v",
      "libx264",
      "-preset",
      "ultrafast",
      "-tune",
      "zerolatency",
      "-b:v",
      bitrate,
      "-g",
      "15",
      "-sc_threshold",
      "0",
    ],
  },
};

/**
 * 自動検出で試すエンコーダの順序。順序に意味があるので表のキー順には頼らない。
 * `satisfies` は要素の型だけを見るため、全エンコーダを含むことは下の型で検査する。
 */
export const encoderOrder = [
  "h264_vaapi",
  "h264_v4l2m2m",
  "libx264",
] as const satisfies readonly EncoderName[];

/** `encoderOrder` に含まれない `EncoderName` があると、ここが型エラーになる。 */
export type EncoderOrderIsExhaustive<
  Missing extends never = Exclude<EncoderName, (typeof encoderOrder)[number]>,
> = Missing;

/** ハードウェアデバイスの初期化引数。ffmpeg の入力 (`-i`) より前に置く。 */
export function buildHwDeviceArgs(encoder: EncoderName): string[] {
  return [...encoders[encoder].hwDeviceArgs];
}

/** `-vf` に渡すフィルタ列。デインターレースとスケールは全エンコーダ共通で CPU 処理。 */
export function buildVideoFilter(encoder: EncoderName, scale: string): string {
  return `yadif=mode=0:parity=-1:deint=1,scale=${scale}${encoders[encoder].filterSuffix}`;
}

/** `VIDEO_ENCODER` の値を比較用に正規化する (前後の空白除去と小文字化)。 */
function normalizeEncoderValue(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/** `VIDEO_ENCODER` の値が (正規化後に) 既知のエンコーダ名か。 */
export function isKnownEncoder(value: string | undefined): boolean {
  const normalized = normalizeEncoderValue(value);
  return encoderOrder.some((enc) => enc === normalized);
}

/**
 * `VIDEO_ENCODER` の値から probe する候補の順序を決める。既知の値 (大文字小文字・
 * 前後の空白は無視) はそれ 1 つ、未設定・空文字・未知の値は自動検出の順序。
 */
export function resolveEncoderCandidates(value: string | undefined): EncoderName[] {
  const normalized = normalizeEncoderValue(value);
  const known = encoderOrder.find((enc) => enc === normalized);
  return known ? [known] : [...encoderOrder];
}

export function buildVideoEncoderArgs(encoder: EncoderName, bitrate: string): string[] {
  return encoders[encoder].encoderArgs(bitrate);
}

/** 子プロセスの stderr を改行単位で prefix 付きログに流す。 */
export function pipeStderr(src: ReadableStream<Uint8Array>, prefix: string): void {
  (async () => {
    const reader = src.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (line) {
          console.error(`${prefix} ${line}`);
        }
      }
    }
    buf += decoder.decode();
    if (buf) {
      console.error(`${prefix} ${buf}`);
    }
  })().catch(() => {
    // プロセス終了時の破損ストリームは無視
  });
}

// 未知の VIDEO_ENCODER の警告はリクエストごとに出さず、プロセスで 1 回だけ出す。
let warnedUnknownEncoder = false;
let cachedEncoder: EncoderName | null = null;
let detectingPromise: Promise<EncoderName | null> | null = null;

async function probeEncoder(encoder: EncoderName): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const child = spawn(
      "ffmpeg",
      [
        "-hide_banner",
        "-v",
        "error",
        ...buildHwDeviceArgs(encoder),
        "-f",
        "lavfi",
        "-i",
        "color=size=320x240:rate=10:duration=1",
        "-vf",
        buildVideoFilter(encoder, "-2:240"),
        ...buildVideoEncoderArgs(encoder, "500k"),
        "-frames:v",
        "10",
        "-f",
        "null",
        "-",
      ],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
    // タイムアウトで probe を打ち切る (spawn の signal オプションは長寿命
    // プロセスの後始末に非推奨 (DEP0209) のため、kill を明示的に呼ぶ)。
    controller.signal.addEventListener("abort", () => child.kill("SIGTERM"), {
      once: true,
    });
    pipeStderr(
      Readable.toWeb(child.stderr) as ReadableStream<Uint8Array>,
      `[encoder-probe ${encoder}]`,
    );
    return await new Promise<boolean>((resolve) => {
      // 起動失敗 (ffmpeg が無い等) は error、終了は exit で届く。
      child.once("error", () => resolve(false));
      child.once("exit", (code) => resolve(code === 0));
    });
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 使用可能な H.264 エンコーダを実 probe で検出する。h264_vaapi → h264_v4l2m2m →
 * libx264 の順に試し、成功したものをキャッシュする。すべて失敗時は null
 * (呼び出し側で 503)。環境変数 `VIDEO_ENCODER` で既知の値を指定した場合は
 * そのエンコーダだけを試し、失敗しても他へは落とさない。
 * null はキャッシュしない (ffmpeg 再インストール等の復旧余地を残す)。
 * 並行リクエストのレースは detectingPromise で直列化する。
 */
export async function detectVideoEncoder(): Promise<EncoderName | null> {
  if (cachedEncoder !== null) {
    return cachedEncoder;
  }
  if (detectingPromise) {
    return detectingPromise;
  }
  detectingPromise = (async () => {
    const value = process.env.VIDEO_ENCODER;
    const candidates = resolveEncoderCandidates(value);
    if (normalizeEncoderValue(value) !== "" && !isKnownEncoder(value) && !warnedUnknownEncoder) {
      warnedUnknownEncoder = true;
      console.warn(
        `[encoder-probe] unknown VIDEO_ENCODER=${value}; falling back to auto-detection`,
      );
    }
    for (const enc of candidates) {
      if (await probeEncoder(enc)) {
        cachedEncoder = enc;
        return enc;
      }
    }
    return null;
  })();
  try {
    return await detectingPromise;
  } finally {
    detectingPromise = null;
  }
}
