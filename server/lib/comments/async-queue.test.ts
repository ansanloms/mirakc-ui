import { assertEquals, assertRejects } from "@std/assert";
import { AsyncQueue } from "./async-queue.ts";

Deno.test("AsyncQueue: push 済みの値を順に消費して close で終わる", async () => {
  const queue = new AsyncQueue<number>();
  queue.push(1);
  queue.push(2);
  queue.close();

  const values: number[] = [];
  for await (const value of queue) {
    values.push(value);
  }
  assertEquals(values, [1, 2]);
});

Deno.test("AsyncQueue: 消費側が先に待っていても push で解決される", async () => {
  const queue = new AsyncQueue<string>();
  const consumer = (async () => {
    const values: string[] = [];
    for await (const value of queue) {
      values.push(value);
    }
    return values;
  })();

  queue.push("a");
  queue.push("b");
  queue.close();
  assertEquals(await consumer, ["a", "b"]);
});

Deno.test("AsyncQueue: エラー付き close は消費側に伝播する", async () => {
  const queue = new AsyncQueue<number>();
  queue.push(1);
  queue.close(new Error("boom"));

  await assertRejects(
    async () => {
      for await (const _ of queue) {
        // 最初の値は受け取れるが、その後 close のエラーが投げられる
      }
    },
    Error,
    "boom",
  );
});

Deno.test("AsyncQueue: close 後の push は無視される", async () => {
  const queue = new AsyncQueue<number>();
  queue.push(1);
  queue.close();
  queue.push(2);

  const values: number[] = [];
  for await (const value of queue) {
    values.push(value);
  }
  assertEquals(values, [1]);
});
