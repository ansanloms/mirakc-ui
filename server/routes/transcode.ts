import { Hono } from "hono";
import {
  buildVideoEncoderArgs,
  detectVideoEncoder,
  pipeStderr,
  qualitySettings,
} from "../lib/encoder.ts";
import { normalizeQuality } from "../lib/quality.ts";
import { mirakcApiUrlOf } from "../lib/mirakc.ts";

/**
 * ライブ視聴のトランスコード配信 (A 方式, #11)。mirakc のサービスストリーム →
 * tsreadex (字幕・音声整形) → ffmpeg (H.264 / AAC 再エンコード) → MPEG-TS を
 * チャンク応答する。`app.route("/api/transcode", transcode)` でマウントする。
 *
 * 旧構成の routes/api/transcode/services/[id].ts と等価。Fresh の ctx 依存
 * (params / searchParams / req.signal) を Hono の Context に置き換えてある。
 */
export const transcode = new Hono();

transcode.get("/services/:id", async (c) => {
  const mirakcUrl = Deno.env.get("MIRAKC_URL") ?? "";
  const mirakcApiUrl = mirakcUrl === "" ? "" : mirakcApiUrlOf(mirakcUrl);
  const serviceId = c.req.param("id");

  const url = new URL(c.req.url);
  const audioTrackParam = url.searchParams.get("audioTrack");
  const audioTrackIndex =
    audioTrackParam !== null && Number.isInteger(Number(audioTrackParam))
      ? Math.max(0, Number(audioTrackParam))
      : 0;

  const quality = normalizeQuality(url.searchParams.get("quality"));
  const { scale, bitrate } = qualitySettings[quality];

  const rawMode = url.searchParams.get("raw") === "1";

  const encoder = await detectVideoEncoder();
  if (encoder === null) {
    return new Response("No usable H.264 encoder found", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  // h264_v4l2m2m は yuv420p のみ受け付けるため format フィルターを付加。
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

  // FFmpeg: 映像を H.264 に、音声を AAC にトランスコード。
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
      `0:a:${audioTrackIndex}?`,
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

  // NOTE: tsreadex 撤去が確定した場合は以下を削除する。
  //   - Dockerfile の tsreadex-build ステージ
  //   - Dockerfile の COPY --from=tsreadex-build および chmod
  //   - 本ファイルの tsreadexChild spawn と pipeStderr([tsreadex])
  //   - 本ファイルの rawMode 分岐とクエリ読取 (常に raw 相当の経路に)
  //   - ffmpeg 引数は変更不要 (-c:d copy -map 0:d? -ignore_unknown で
  //     字幕 PES を保持)
  let tsreadexChild: Deno.ChildProcess | null = null;
  if (!rawMode) {
    // tsreadex: ARIB 字幕周りを整形しつつストリームを安定化。
    tsreadexChild = new Deno.Command("tsreadex", {
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
  }

  // client 切断・子プロセス異常終了・上流切断のいずれでも tsreadex と ffmpeg
  // を確実に SIGTERM → SIGKILL で落とすためのヘルパ。冪等。
  let cleanedUp = false;
  const cleanup = (reason: string) => {
    if (cleanedUp) {
      return;
    }
    cleanedUp = true;
    console.error(
      `[transcode] cleanup serviceId=${serviceId} reason=${reason}`,
    );
    const term = (child: Deno.ChildProcess | null) => {
      if (!child) {
        return;
      }
      try {
        child.kill("SIGTERM");
      } catch {
        // already exited
      }
    };
    term(tsreadexChild);
    term(ffmpegChild);
    setTimeout(() => {
      const force = (child: Deno.ChildProcess | null) => {
        if (!child) {
          return;
        }
        try {
          child.kill("SIGKILL");
        } catch {
          // already exited
        }
      };
      force(tsreadexChild);
      force(ffmpegChild);
    }, 3000);
  };

  c.req.raw.signal.addEventListener(
    "abort",
    () => cleanup("client abort"),
    { once: true },
  );

  ffmpegChild.status
    .then((s) => cleanup(`ffmpeg exited code=${s.code}`))
    .catch(() => {});
  tsreadexChild?.status
    .then((s) => cleanup(`tsreadex exited code=${s.code}`))
    .catch(() => {});

  if (rawMode) {
    // raw モード: mirakc → ffmpeg → client (tsreadex バイパス)。
    // 字幕 PES は ffmpeg の `-c:d copy -map 0:d?` で MPEG-TS に残り、
    // クライアント側 aribb24.js が PES_PRIVATE_DATA_ARRIVED で拾う。
    mirakcResponse.body.pipeTo(ffmpegChild.stdin).catch(() => {
      cleanup("mirakc -> ffmpeg pipe ended");
    });
  } else {
    mirakcResponse.body.pipeTo(tsreadexChild!.stdin).catch(() => {
      cleanup("mirakc -> tsreadex pipe ended");
    });
    tsreadexChild!.stdout.pipeTo(ffmpegChild.stdin).catch(() => {
      cleanup("tsreadex -> ffmpeg pipe ended");
    });
  }

  // ffmpeg stdout を Response body に流す。client 側 reader が途中で cancel
  // した場合にも UnderlyingSource.cancel で cleanup を走らせる。
  const responseBody = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = ffmpegChild.stdout.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            return;
          }
          controller.enqueue(value);
        }
      } catch (e) {
        controller.error(e);
      } finally {
        try {
          reader.releaseLock();
        } catch {
          // already released
        }
      }
    },
    cancel() {
      cleanup("response body cancel");
    },
  });

  return new Response(responseBody, {
    status: 200,
    headers: {
      "Content-Type": "video/mp2t",
      "Cache-Control": "no-cache",
    },
  });
});
