import { sendRecordingBegin, sendRecordingFinish } from "./web-push/mod.ts";

Deno.cron("send recording begin", "* * * * *", async () => {
  await sendRecordingBegin();
});

Deno.cron("send recording finish", "* * * * *", async () => {
  await sendRecordingFinish();
});
