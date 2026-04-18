import type { FreshContext } from "fresh";
import { define } from "../../../../utils.ts";

type Quality = "480p" | "720p" | "1024p";
type EncoderName = "h264_v4l2m2m" | "libx264";

const qualitySettings: Record<Quality, { scale: string; bitrate: string }> = {
  "480p": { scale: "-2:480", bitrate: "1000k" },
  "720p": { scale: "-2:720", bitrate: "2000k" },
  "1024p": { scale: "-2:1024", bitrate: "3500k" },
};

let cachedEncoder: EncoderName | null = null;
let detectingPromise: Promise<EncoderName | null> | null = null;

function buildVideoEncoderArgs(
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

function pipeStderr(
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

async function detectVideoEncoder(): Promise<EncoderName | null> {
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

export const handler = define.handlers({
  async GET(ctx: FreshContext) {
    const mirakcApiUrl = Deno.env.get("MIRAKC_API_URL") ?? "";
    const serviceId = ctx.params.id;

    const audioTrackParam = ctx.url.searchParams.get("audioTrack");
    const audioTrackIndex =
      audioTrackParam !== null && Number.isInteger(Number(audioTrackParam))
        ? Math.max(0, Number(audioTrackParam))
        : 0;

    const qualityParam = ctx.url.searchParams.get("quality") ?? "720p";
    const quality: Quality = qualityParam in qualitySettings
      ? (qualityParam as Quality)
      : "720p";
    const { scale, bitrate } = qualitySettings[quality];

    const rawMode = ctx.url.searchParams.get("raw") === "1";

    const encoder = await detectVideoEncoder();
    if (encoder === null) {
      return new Response("No usable H.264 encoder found", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // h264_v4l2m2m は yuv420p のみ受け付けるため format フィルターを付加
    const vf = encoder === "h264_v4l2m2m"
      ? `yadif=mode=0:parity=-1:deint=1,scale=${scale},format=yuv420p`
      : `yadif=mode=0:parity=-1:deint=1,scale=${scale}`;

    const streamUrl = new URL(
      `${mirakcApiUrl}/services/${serviceId}/stream?decode=1`,
    );

    const mirakcResponse = await fetch(streamUrl.toString());

    if (!mirakcResponse.ok || !mirakcResponse.body) {
      return new Response("Failed to fetch stream from mirakc", {
        status: mirakcResponse.status,
      });
    }

    console.error(
      `[transcode] serviceId=${serviceId} encoder=${encoder} raw=${rawMode} quality=${quality} audioTrack=${audioTrackIndex}`,
    );

    // FFmpeg: 映像を H.264 に、音声を AAC にトランスコード
    const ffmpegChild = new Deno.Command("ffmpeg", {
      args: [
        "-fflags",
        "nobuffer",
        "-analyzeduration",
        "0",
        "-i",
        "pipe:0",
        "-map",
        "0:v:0",
        "-map",
        `0:a:${audioTrackIndex}`,
        "-map",
        "0:d?",
        "-ignore_unknown",
        "-max_delay",
        "250000",
        "-vf",
        vf,
        ...buildVideoEncoderArgs(encoder, bitrate),
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-c:d",
        "copy",
        "-f",
        "mpegts",
        "pipe:1",
      ],
      stdin: "piped",
      stdout: "piped",
      stderr: "piped",
    }).spawn();
    pipeStderr(ffmpegChild.stderr, "[ffmpeg]");

    if (rawMode) {
      // raw モード: mirakc → ffmpeg → client (tsreadex バイパス)
      // 字幕 PES は ffmpeg の `-c:d copy -map 0:d?` で MPEG-TS に残り、
      // クライアント側 aribb24.js が PES_PRIVATE_DATA_ARRIVED で拾う。
      mirakcResponse.body.pipeTo(ffmpegChild.stdin).catch(() => {
        // チャンネル切替等でクライアントが切断した場合は無視
      });
    } else {
      // NOTE: tsreadex 撤去が確定した場合は以下を削除する。
      //   - Dockerfile の tsreadex-build ステージ
      //   - Dockerfile の COPY --from=tsreadex-build および chmod
      //   - 本ファイルの tsreadexChild spawn と pipeStderr([tsreadex])
      //   - 本ファイルの rawMode 分岐とクエリ読取 (常に raw 相当の経路に)
      //   - ffmpeg 引数は変更不要 (-c:d copy -map 0:d? -ignore_unknown で
      //     字幕 PES を保持)
      //
      // tsreadex: ARIB 字幕周りを整形しつつストリームを安定化
      const tsreadexChild = new Deno.Command("tsreadex", {
        args: [
          "-n",
          "-1",
          "-a",
          "13",
          "-b",
          "5",
          "-c",
          "5",
          "-u",
          "1",
          "-d",
          "13",
          "-",
        ],
        stdin: "piped",
        stdout: "piped",
        stderr: "piped",
      }).spawn();
      pipeStderr(tsreadexChild.stderr, "[tsreadex]");

      mirakcResponse.body.pipeTo(tsreadexChild.stdin).catch(() => {
        // チャンネル切替等でクライアントが切断した場合は無視
      });

      tsreadexChild.stdout.pipeTo(ffmpegChild.stdin).catch(() => {
        // tsreadex → FFmpeg パイプ切断時は無視
      });
    }

    return new Response(ffmpegChild.stdout, {
      status: 200,
      headers: {
        "Content-Type": "video/mp2t",
        "Cache-Control": "no-cache",
      },
    });
  },
});
