import assert from "node:assert/strict";
import { test } from "node:test";
import { AsyncQueue } from "./async-queue.ts";

test("AsyncQueue: push 済みの値を順に消費して close で終わる", async () => {
  const queue = new AsyncQueue<number>();
  queue.push(1);
  queue.push(2);
  queue.close();

  const values: number[] = [];
  for await (const value of queue) {
    values.push(value);
  }
  assert.deepStrictEqual(values, [1, 2]);
});

test("AsyncQueue: 消費側が先に待っていても push で解決される", async () => {
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
  assert.deepStrictEqual(await consumer, ["a", "b"]);
});

test("AsyncQueue: エラー付き close は消費側に伝播する", async () => {
  const queue = new AsyncQueue<number>();
  queue.push(1);
  queue.close(new Error("boom"));

  await assert.rejects(
    async () => {
      for await (const _ of queue) {
        // 最初の値は受け取れるが、その後 close のエラーが投げられる
      }
    },
    (e: unknown) => e instanceof Error && e.message.includes("boom"),
  );
});

test("AsyncQueue: close 後の push は無視される", async () => {
  const queue = new AsyncQueue<number>();
  queue.push(1);
  queue.close();
  queue.push(2);

  const values: number[] = [];
  for await (const value of queue) {
    values.push(value);
  }
  assert.deepStrictEqual(values, [1]);
});
