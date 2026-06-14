/**
 * push 型の供給を AsyncIterable に変換する小さなキュー。
 *
 * NDGR のように「View ストリームの読み取りと複数 Segment の並行受信」が
 * 同時に走る供給側を、単一の async generator (消費側) に束ねるために使う。
 */
export class AsyncQueue<T> implements AsyncIterable<T> {
  #values: T[] = [];
  #waiter: ((result: IteratorResult<T>) => void) | null = null;
  #waiterReject: ((error: unknown) => void) | null = null;
  #closed = false;
  #error: unknown = undefined;

  /** 値を 1 件供給する。close 済みなら無視する。 */
  push(value: T): void {
    if (this.#closed) {
      return;
    }
    if (this.#waiter !== null) {
      const resolve = this.#waiter;
      this.#waiter = null;
      this.#waiterReject = null;
      resolve({ value, done: false });
      return;
    }
    this.#values.push(value);
  }

  /**
   * 供給を終了する。error を渡すと、キューに残った値を消費し切った後に
   * 消費側へ伝播する。複数回呼ばれても 2 回目以降は無視する。
   */
  close(error?: unknown): void {
    if (this.#closed) {
      return;
    }
    this.#closed = true;
    this.#error = error;
    if (this.#waiter !== null) {
      const resolve = this.#waiter;
      const reject = this.#waiterReject;
      this.#waiter = null;
      this.#waiterReject = null;
      if (error !== undefined && reject !== null) {
        reject(error);
      } else {
        resolve({ value: undefined, done: true });
      }
    }
  }

  async *[Symbol.asyncIterator](): AsyncGenerator<T> {
    while (true) {
      if (this.#values.length > 0) {
        yield this.#values.shift()!;
        continue;
      }
      if (this.#closed) {
        if (this.#error !== undefined) {
          throw this.#error;
        }
        return;
      }
      const result = await new Promise<IteratorResult<T>>(
        (resolve, reject) => {
          this.#waiter = resolve;
          this.#waiterReject = reject;
        },
      );
      if (result.done) {
        return;
      }
      yield result.value;
    }
  }
}
