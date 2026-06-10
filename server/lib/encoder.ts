/**
 * H.264 エンコーダの検出とトランスコード用の ffmpeg 引数生成。
 *
 * `ffmpeg -encoders` の文字列一致はデバイス有無を判定できず誤検出するため
 * (Debian の ffmpeg pkg は h264_v4l2m2m をビルド済みだが /dev/video* が無いと
 * 使えない)、実エンコードテスト (probe) で検証する。
 */

import type { Quality } from "./quality.ts";

export type EncoderName = "h264_v4l2m2m" | "libx264";

export const qualitySettings: Record<
  Quality,
  { scale: string; bitrate: string }
> = {
  "480p": { scale: "-2:480", bitrate: "1000k" },
  "720p": { scale: "-2:720", bitrate: "2000k" },
  "1024p": { scale: "-2:1024", bitrate: "3500k" },
};

export function buildVideoEncoderArgs(
  encoder: EncoderName,
  bitrate: string,
): string[] {
  if (encoder === "h264_v4l2m2m") {
    return [
      "-c:v",
      "h264_v4l2m2m",
      "-b:v",
      bitrate,
      "-g",
      "15",
    ];
  }
  return [
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
  ];
}

/** 子プロセスの stderr を改行単位で prefix 付きログに流す。 */
export function pipeStderr(
  src: ReadableStream<Uint8Array>,
  prefix: string,
): void {
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

let cachedEncoder: EncoderName | null = null;
let detectingPromise: Promise<EncoderName | null> | null = null;

async function probeEncoder(encoder: EncoderName): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const child = new Deno.Command("ffmpeg", {
      args: [
        "-hide_banner",
        "-v",
        "error",
        "-f",
        "lavfi",
        "-i",
        "color=size=320x240:rate=10:duration=1",
        ...buildVideoEncoderArgs(encoder, "500k"),
        "-frames:v",
        "10",
        "-f",
        "null",
        "-",
      ],
      stdin: "null",
      stdout: "null",
      stderr: "piped",
      signal: controller.signal,
    }).spawn();
    pipeStderr(child.stderr, `[encoder-probe ${encoder}]`);
    const status = await child.status;
    return status.success;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 使用可能な H.264 エンコーダを実 probe で検出する。h264_v4l2m2m → libx264 の
 * 順に試し、成功した方をキャッシュする。両方失敗時は null (呼び出し側で 503)。
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
    for (const enc of ["h264_v4l2m2m", "libx264"] as const) {
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
