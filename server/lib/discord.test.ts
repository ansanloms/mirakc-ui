import { assertEquals } from "@std/assert";
import { sendDiscord } from "./discord.ts";

type Captured = { url: string; body: unknown };

function capture(status = 204) {
  const requests: Captured[] = [];
  const fetchFn = ((input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({
      url: String(input),
      body: JSON.parse(String(init?.body)),
    });
    return Promise.resolve(
      new Response(status === 204 ? null : "ok", { status }),
    );
  }) as typeof fetch;
  return { requests, fetchFn };
}

const WEBHOOK = "https://discord.com/api/webhooks/123/abc";

Deno.test("sendDiscord: Webhook URL へ embed を POST する", async () => {
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

  assertEquals(ok, true);
  assertEquals(requests.length, 1);
  assertEquals(requests[0].url, WEBHOOK);
  // tags は Discord では使わない。title / description / color の embed になる。
  assertEquals(requests[0].body, {
    embeds: [{ title: "録画開始", description: "本文", color: 0x57f287 }],
  });
});

Deno.test("sendDiscord: message 空 / color 未指定なら省く", async () => {
  const { requests, fetchFn } = capture();

  await sendDiscord(
    { webhookUrl: WEBHOOK },
    { title: "t", message: "" },
    fetchFn,
  );

  assertEquals(requests[0].body, { embeds: [{ title: "t" }] });
});

Deno.test("sendDiscord: 上限超過の title / description は切り詰める", async () => {
  const { requests, fetchFn } = capture();

  await sendDiscord(
    { webhookUrl: WEBHOOK },
    { title: "あ".repeat(300), message: "い".repeat(5000) },
    fetchFn,
  );

  const embed =
    (requests[0].body as { embeds: { title: string; description: string }[] })
      .embeds[0];
  assertEquals(embed.title.length, 256);
  assertEquals(embed.description.length, 4096);
  assertEquals(embed.title.endsWith("…"), true);
});

Deno.test("sendDiscord: Webhook URL が不正なら送信せず false", async () => {
  const { requests, fetchFn } = capture();

  assertEquals(
    await sendDiscord(
      { webhookUrl: "https://example.com/not-a-webhook" },
      { title: "t", message: "m" },
      fetchFn,
    ),
    false,
  );
  assertEquals(
    await sendDiscord(
      { webhookUrl: "" },
      { title: "t", message: "m" },
      fetchFn,
    ),
    false,
  );
  assertEquals(requests.length, 0);
});

Deno.test("sendDiscord: 失敗 (非 2xx / 例外) は false を返し throw しない", async () => {
  const { fetchFn: notOk } = capture(400);
  assertEquals(
    await sendDiscord(
      { webhookUrl: WEBHOOK },
      { title: "t", message: "m" },
      notOk,
    ),
    false,
  );

  const throwing = (() => Promise.reject(new Error("down"))) as typeof fetch;
  assertEquals(
    await sendDiscord(
      { webhookUrl: WEBHOOK },
      { title: "t", message: "m" },
      throwing,
    ),
    false,
  );
});
