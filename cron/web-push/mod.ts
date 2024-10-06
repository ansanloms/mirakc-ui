import webpush from "web-push/index.js";
import * as datetime from "$std/datetime/mod.ts";
import * as kv from "../../_utils/kv.ts";
import type { Subscribe } from "../../_utils/kv.ts";
import createClient from "openapi-fetch";
import type { paths } from "../../hooks/api/schema.d.ts";
import { t } from "../../locales/i18n.ts";

const send = async (
  publicKey: string,
  privateKey: string,
  subscription: PushSubscription,
  payload: {
    title?: string;
    body?: string;
    actions?: { title: string; action: string }[];
  },
) => {
  await webpush.sendNotification(
    subscription,
    JSON.stringify(payload),
    {
      vapidDetails: {
        subject: Deno.env.get("VAPID_SUBJECT") || "",
        publicKey,
        privateKey,
      },
      headers: { Urgency: "high" },
      TTL: 0,
    },
  );
};

const sendAll = async (
  payload: {
    title?: string;
    body?: string;
    actions?: { title: string; action: string }[];
  },
) => {
  await Promise.all(
    (await kv.list<Subscribe>("subscribe")).map(
      async ({ publicKey, privateKey, subscription }) => {
        if (subscription) {
          await send(publicKey, privateKey, subscription, payload);
        }
      },
    ),
  );
};

const client = createClient<paths>({
  baseUrl: Deno.env.get("MIRAKC_API_URL"),
});

export const sendRecordingBegin = async () => {
  try {
    const recordingSchedules = (await client.GET(
      "/recording/schedules",
    )).data?.filter((recordingSchedule) => {
      const startAt = new Date(recordingSchedule.program.startAt);
      const now = new Date();
      const diff = (startAt.getTime() - now.getTime()) / (60 * 1000);

      return diff <= 5 && diff >= 4;
    });

    await Promise.all(
      (recordingSchedules || []).map(async (recordingSchedule) => {
        await sendAll({
          title: `${t("recording.recordingBegin")} - ${
            recordingSchedule.program.name || "(unknown)"
          }`,
          body: `${
            datetime.format(
              new Date(recordingSchedule.program.startAt),
              "yyyy-MM-dd H:mm",
            )
          }`,
        });
      }),
    );
  } catch (error) {
    console.error(error);
  }
};

export const sendRecordingFinish = async () => {
  try {
    const recordingSchedules = (await client.GET(
      "/recording/schedules",
    )).data?.filter((recordingSchedule) => {
      const endAt = new Date(
        recordingSchedule.program.startAt +
          recordingSchedule.program.duration,
      );
      const now = new Date();
      const diff = (now.getTime() - endAt.getTime()) / (60 * 1000);

      return diff <= 2 && diff >= 1;
    });

    await Promise.all(
      (recordingSchedules || []).map(async (recordingSchedule) => {
        await sendAll({
          title: `${t("recording.recordingFinish")} - ${
            recordingSchedule.program.name || "(unknown)"
          }`,
          body: `${t(`recording.status.state.${recordingSchedule.state}`)} ${
            recordingSchedule.failedReason
              ? `(${
                t(`recording.failedReason.type.${recordingSchedule.failedReason.type}`)
              })`
              : ""
          }`,
        });
      }),
    );
  } catch (error) {
    console.error(error);
  }
};
