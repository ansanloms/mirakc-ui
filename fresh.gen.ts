// DO NOT EDIT. This file is generated by Fresh.
// This file SHOULD be checked into source version control.
// This file is automatically updated during development when running `dev.ts`.

import * as $_app from "./routes/_app.tsx";
import * as $api_path_ from "./routes/api/[...path].ts";
import * as $api_stream_sid_ from "./routes/api/stream/[sid].ts";
import * as $program from "./routes/program.tsx";
import * as $recording from "./routes/recording.tsx";
import * as $stream_sid_ from "./routes/stream/[sid].tsx";
import * as $Program from "./islands/Program.tsx";
import * as $Recording from "./islands/Recording.tsx";
import * as $Stream from "./islands/Stream.tsx";
import { type Manifest } from "$fresh/server.ts";

const manifest = {
  routes: {
    "./routes/_app.tsx": $_app,
    "./routes/api/[...path].ts": $api_path_,
    "./routes/api/stream/[sid].ts": $api_stream_sid_,
    "./routes/program.tsx": $program,
    "./routes/recording.tsx": $recording,
    "./routes/stream/[sid].tsx": $stream_sid_,
  },
  islands: {
    "./islands/Program.tsx": $Program,
    "./islands/Recording.tsx": $Recording,
    "./islands/Stream.tsx": $Stream,
  },
  baseUrl: import.meta.url,
} satisfies Manifest;

export default manifest;
