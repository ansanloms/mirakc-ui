import assert from "node:assert/strict";
import { test } from "node:test";
import { sendDiscord } from "./discord.ts";

type Captured = { url: string; body: unknown };

function capture(status = 204) {
  const requests: Captured[] = [];
  const fetchFn = ((input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({
      url: String(input),
      body: JSON.parse(String(init?.body)),
    });
    return Promise.resolve(new Response(status === 204 ? null : "ok", { status }));
  }) as typeof fetch;
  return { requests, fetchFn };
}

const WEBHOOK = "https://discord.com/api/webhooks/123/abc";

test("sendDiscord: Webhook URL へ embed を POST する", async () => {
  const { requests, fetchFn } = capture();

  const ok = await sendDiscord(
    { webhookUrl: WEBHOOK },
    {
      title: "録画開始",
      message: "本文",
      tags: ["red_circle"],
      color: 0x57f287,
    },
    fetchFn,
  );

  assert.deepStrictEqual(ok, true);
  assert.deepStrictEqual(requests.length, 1);
  assert.deepStrictEqual(requests[0].url, WEBHOOK);
  // tags は Discord では使わない。title / description / color の embed になる。
  assert.deepStrictEqual(requests[0].body, {
    embeds: [{ title: "録画開始", description: "本文", color: 0x57f287 }],
  });
});

test("sendDiscord: message 空 / color 未指定なら省く", async () => {
  const { requests, fetchFn } = capture();

  await sendDiscord({ webhookUrl: WEBHOOK }, { title: "t", message: "" }, fetchFn);

  assert.deepStrictEqual(requests[0].body, { embeds: [{ title: "t" }] });
});

test("sendDiscord: 上限超過の title / description は切り詰める", async () => {
  const { requests, fetchFn } = capture();

  await sendDiscord(
    { webhookUrl: WEBHOOK },
    { title: "あ".repeat(300), message: "い".repeat(5000) },
    fetchFn,
  );

  const embed = (requests[0].body as { embeds: { title: string; description: string }[] })
    .embeds[0];
  assert.deepStrictEqual(embed.title.length, 256);
  assert.deepStrictEqual(embed.description.length, 4096);
  assert.deepStrictEqual(embed.title.endsWith("…"), true);
});

test("sendDiscord: Webhook URL が不正なら送信せず false", async () => {
  const { requests, fetchFn } = capture();

  assert.deepStrictEqual(
    await sendDiscord(
      { webhookUrl: "https://example.com/not-a-webhook" },
      { title: "t", message: "m" },
      fetchFn,
    ),
    false,
  );
  assert.deepStrictEqual(
    await sendDiscord({ webhookUrl: "" }, { title: "t", message: "m" }, fetchFn),
    false,
  );
  assert.deepStrictEqual(requests.length, 0);
});

test("sendDiscord: 失敗 (非 2xx / 例外) は false を返し throw しない", async () => {
  const { fetchFn: notOk } = capture(400);
  assert.deepStrictEqual(
    await sendDiscord({ webhookUrl: WEBHOOK }, { title: "t", message: "m" }, notOk),
    false,
  );

  const throwing = (() => Promise.reject(new Error("down"))) as typeof fetch;
  assert.deepStrictEqual(
    await sendDiscord({ webhookUrl: WEBHOOK }, { title: "t", message: "m" }, throwing),
    false,
  );
});
