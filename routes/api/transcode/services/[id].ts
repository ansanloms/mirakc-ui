import type { FreshContext } from "fresh";
import { define } from "../../../../utils.ts";

type Quality = "480p" | "720p" | "1024p";

const qualitySettings: Record<Quality, { scale: string; bitrate: string }> = {
  "480p": { scale: "-2:480", bitrate: "1000k" },
  "720p": { scale: "-2:720", bitrate: "2000k" },
  "1024p": { scale: "-2:1024", bitrate: "3500k" },
};

// h264_v4l2m2m 利用可否をプロセス起動時に一度だけ検出してキャッシュ
let cachedEncoder: "h264_v4l2m2m" | "libx264" | null = null;

async function detectVideoEncoder(): Promise<"h264_v4l2m2m" | "libx264"> {
  if (cachedEncoder !== null) return cachedEncoder;
  try {
    const { stdout } = await new Deno.Command("ffmpeg", {
      args: ["-hide_banner", "-encoders"],
      stdout: "piped",
      stderr: "null",
    }).output();
    const list = new TextDecoder().decode(stdout);
    cachedEncoder = list.includes("h264_v4l2m2m") ? "h264_v4l2m2m" : "libx264";
  } catch {
    cachedEncoder = "libx264";
  }
  return cachedEncoder;
}

function buildVideoEncoderArgs(
  encoder: "h264_v4l2m2m" | "libx264",
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

    const encoder = await detectVideoEncoder();

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

    // tsreadex: ARIB 字幕を ID3 timed-metadata に変換し、ストリームを安定化
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
      stderr: "null",
    }).spawn();

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
      stderr: "null",
    }).spawn();

    // パイプライン: mirakc → tsreadex → FFmpeg → client
    mirakcResponse.body.pipeTo(tsreadexChild.stdin).catch(() => {
      // チャンネル切替等でクライアントが切断した場合は無視
    });

    tsreadexChild.stdout.pipeTo(ffmpegChild.stdin).catch(() => {
      // tsreadex → FFmpeg パイプ切断時は無視
    });

    return new Response(ffmpegChild.stdout, {
      status: 200,
      headers: {
        "Content-Type": "video/mp2t",
        "Cache-Control": "no-cache",
      },
    });
  },
});
