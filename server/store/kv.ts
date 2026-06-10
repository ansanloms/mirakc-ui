/**
 * 設定系データの永続化基盤 (Deno KV のラッパー)。
 *
 * - 置き場所は環境変数 `DATA_DIR` (既定 `./data`) 配下の `kv.sqlite3`。
 *   Docker 運用ではこのディレクトリを volume にマウントして永続化する
 * - `Kv` が lazy open・親ディレクトリ作成・基本操作 (get / set / list /
 *   remove / close) を引き受け、各 store (server/store/*.ts) はキー設計と
 *   型ガードに専念する
 * - 1 プロセスで 1 インスタンスを共有する (main.ts で生成して各 store に
 *   注入)。テストは `new Kv(":memory:")` で分離する
 */

/** 設定系データのディレクトリ (`DATA_DIR`、既定 `./data`)。 */
export function dataDir(): string {
  const dir = Deno.env.get("DATA_DIR")?.trim().replace(/\/+$/, "");
  return dir ? dir : "./data";
}

/** Deno KV の SQLite ファイルパス (`${DATA_DIR}/kv.sqlite3`)。 */
export function kvPath(): string {
  return `${dataDir()}/kv.sqlite3`;
}

/** Deno KV の薄いラッパー。 */
export class Kv {
  #path: string;
  #kv: Promise<Deno.Kv> | null = null;

  /** path はテスト用に差し替え可能 (`":memory:"` など)。既定は kvPath()。 */
  constructor(path: string = kvPath()) {
    this.#path = path;
  }

  #open(): Promise<Deno.Kv> {
    if (this.#kv === null) {
      this.#kv = (async () => {
        // SQLite ファイルの親ディレクトリが無いと openKv が失敗する。
        const dir = this.#path.replace(/\/[^/]*$/, "");
        if (dir !== "" && dir !== this.#path) {
          await Deno.mkdir(dir, { recursive: true });
        }
        return await Deno.openKv(this.#path);
      })();
    }
    return this.#kv;
  }

  /** key の値。無ければ null。 */
  async get(key: Deno.KvKey): Promise<unknown> {
    const kv = await this.#open();
    return (await kv.get(key)).value;
  }

  /** key に値を保存する。 */
  async set(key: Deno.KvKey, value: unknown): Promise<void> {
    const kv = await this.#open();
    await kv.set(key, value);
  }

  /** prefix 配下の値一覧 (キー順)。 */
  async listValues(prefix: Deno.KvKey): Promise<unknown[]> {
    const kv = await this.#open();
    const values: unknown[] = [];
    for await (const entry of kv.list({ prefix })) {
      values.push(entry.value);
    }
    return values;
  }

  /** key を削除する。存在していたら true。 */
  async remove(key: Deno.KvKey): Promise<boolean> {
    const kv = await this.#open();
    const current = await kv.get(key);
    if (current.versionstamp === null) {
      return false;
    }
    await kv.delete(key);
    return true;
  }

  /** KV を閉じる (テスト用)。 */
  async close(): Promise<void> {
    if (this.#kv !== null) {
      (await this.#kv).close();
      this.#kv = null;
    }
  }
}
