import { assertEquals } from "@std/assert";
import { sendNtfy } from "./ntfy.ts";

type Captured = { url: string; headers: Record<string, string>; body: unknown };

function capture(status = 200) {
  const requests: Captured[] = [];
  const fetchFn = ((input: RequestInfo | URL, init?: RequestInit) => {
    requests.push({
      url: String(input),
      headers: Object.fromEntries(
        Object.entries(init?.headers as Record<string, string> ?? {}),
      ),
      body: JSON.parse(String(init?.body)),
    });
    return Promise.resolve(new Response("ok", { status }));
  }) as typeof fetch;
  return { requests, fetchFn };
}

Deno.test("sendNtfy: base へ JSON publishing 形式で POST する", async () => {
  const { requests, fetchFn } = capture();

  const ok = await sendNtfy(
    { url: "https://ntfy.example.com/sub/mirakc", token: "" },
    { title: "録画開始", message: "本文", tags: ["red_circle"] },
    fetchFn,
  );

  assertEquals(ok, true);
  assertEquals(requests.length, 1);
  assertEquals(requests[0].url, "https://ntfy.example.com/sub");
  assertEquals(requests[0].body, {
    topic: "mirakc",
    title: "録画開始",
    message: "本文",
    tags: ["red_circle"],
  });
  assertEquals(requests[0].headers["authorization"], undefined);
});

Deno.test("sendNtfy: token があれば Authorization: Bearer を付ける", async () => {
  const { requests, fetchFn } = capture();

  await sendNtfy(
    { url: "https://ntfy.sh/mirakc", token: "tk_abc" },
    { title: "t", message: "m" },
    fetchFn,
  );

  assertEquals(requests[0].headers["authorization"], "Bearer tk_abc");
});

Deno.test("sendNtfy: URL が分解できなければ送信せず false", async () => {
  const { requests, fetchFn } = capture();

  assertEquals(
    await sendNtfy(
      { url: "https://ntfy.sh", token: "" },
      { title: "t", message: "m" },
      fetchFn,
    ),
    false,
  );
  assertEquals(
    await sendNtfy(
      { url: "", token: "" },
      { title: "t", message: "m" },
      fetchFn,
    ),
    false,
  );
  assertEquals(requests.length, 0);
});

Deno.test("sendNtfy: 失敗 (非 2xx / 例外) は false を返し throw しない", async () => {
  const { fetchFn: notOk } = capture(500);
  assertEquals(
    await sendNtfy(
      { url: "https://ntfy.sh/x", token: "" },
      { title: "t", message: "m" },
      notOk,
    ),
    false,
  );

  const throwing = (() => Promise.reject(new Error("down"))) as typeof fetch;
  assertEquals(
    await sendNtfy(
      { url: "https://ntfy.sh/x", token: "" },
      { title: "t", message: "m" },
      throwing,
    ),
    false,
  );
});
