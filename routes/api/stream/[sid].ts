import { Handler, Handlers } from "$fresh/server.ts";

const stream: Handler = (req, ctx) => {
  const url = new URL(Deno.env.get("MIRAKC_API_URL") || "");
  url.pathname = url.pathname + `/services/${ctx.params.sid}/stream`;

  const query = new URL(req.url).searchParams;
  const audio = Number(query.get("audio") || 1);

  const command = new Deno.Command("ffmpeg", {
    args: [
      "-i",
      url.toString(),
      "-loglevel",
      "fatal",
      "-f",
      "mp4",
      "-c:v",
      "libx264",
      "-c:a",
      "aac",
      "-c:s",
      "mov_text",
      "-preset",
      "veryfast",
      "-map",
      "0:v",
      "-map",
      `0:a:${audio}`,
      "-movflags",
      "frag_keyframe+empty_moov",
      "pipe:1",
    ],
    stdout: "piped",
  });

  const child = command.spawn();

  return new Response(child.stdout, {
    headers: {
      "Content-Type": "video/mp4",
    },
  });
};

export const handler: Handlers = {
  GET: stream,
};
