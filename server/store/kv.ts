/**
 * 設定系データの永続化基盤 (Deno KV のラッパーと汎用ストア)。
 *
 * - 置き場所は環境変数 `DATA_DIR` (既定 `./data`) 配下の `kv.sqlite3`。
 *   Docker 運用ではこのディレクトリを volume にマウントして永続化する
 * - `createKv` が lazy open・親ディレクトリ作成・基本操作 (get / set /
 *   listValues / remove / close) を引き受ける。1 プロセスで 1 インスタンスを
 *   共有する (main.ts で生成して各ストアに注入)。テストは
 *   `createKv(":memory:")` で分離する
 * - `collectionStore` / `singletonStore` が CRUD の骨格を担い、各ドメインの
 *   ストア (server/store/*.ts) はキー設計・型ガード・正規化を渡すだけの薄い
 *   構成にする。class は持たず、依存 (Kv) はクロージャに束ねる
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

/** Deno KV の薄いラッパー。lazy-open 状態はクロージャに閉じる。 */
export type Kv = {
  /** key の値。無ければ null。 */
  get(key: Deno.KvKey): Promise<unknown>;
  /** key に値を保存する。 */
  set(key: Deno.KvKey, value: unknown): Promise<void>;
  /** prefix 配下の値一覧 (キー順)。 */
  listValues(prefix: Deno.KvKey): Promise<unknown[]>;
  /** key を削除する。存在していたら true。 */
  remove(key: Deno.KvKey): Promise<boolean>;
  /** KV を閉じる (テスト用)。 */
  close(): Promise<void>;
};

/** Kv を生成する。path はテスト用に差し替え可能 (`":memory:"` など)。 */
export function createKv(path: string = kvPath()): Kv {
  let opened: Promise<Deno.Kv> | null = null;
  const open = (): Promise<Deno.Kv> => {
    if (opened === null) {
      opened = (async () => {
        // SQLite ファイルの親ディレクトリが無いと openKv が失敗する。
        const dir = path.replace(/\/[^/]*$/, "");
        if (dir !== "" && dir !== path) {
          await Deno.mkdir(dir, { recursive: true });
        }
        return await Deno.openKv(path);
      })();
    }
    return opened;
  };

  return {
    async get(key) {
      const db = await open();
      return (await db.get(key)).value;
    },
    async set(key, value) {
      const db = await open();
      await db.set(key, value);
    },
    async listValues(prefix) {
      const db = await open();
      const values: unknown[] = [];
      for await (const entry of db.list({ prefix })) {
        values.push(entry.value);
      }
      return values;
    },
    async remove(key) {
      const db = await open();
      const current = await db.get(key);
      if (current.versionstamp === null) {
        return false;
      }
      await db.delete(key);
      return true;
    },
    async close() {
      if (opened !== null) {
        (await opened).close();
        opened = null;
      }
    },
  };
}

/**
 * prefix 配下に複数レコードを持つコレクション型ストア。各レコードは安定 id と
 * createdAt を持つ (`["settings", <name>, <id>]`)。Deno KV は id を自動採番
 * しないため (versionstamp は更新で変わり安定 id にならない)、add で
 * crypto.randomUUID() を採番する。
 */
export type CollectionStore<T, Input> = {
  /** 保存済みレコードの一覧 (既定で createdAt 降順 → id)。 */
  list(): Promise<T[]>;
  /** レコードを追加する。id / createdAt を付与する。 */
  add(input: Input, now?: number): Promise<T>;
  /** 既存レコードを上書きする。id / createdAt は維持。無ければ null。 */
  update(id: string, input: Input): Promise<T | null>;
  /** id 一致のレコードを削除する。削除したら true、無ければ false。 */
  remove(id: string): Promise<boolean>;
};

/**
 * コレクション型ストアを生成する。レコードは `{ ...input, id, createdAt }` の
 * 形で保存し、読み戻しは normalize → isValid の順で旧形状の補完と検証を行い、
 * 壊れた値を除く。normalize は singletonStore と対称で、KV に残る旧スキーマを
 * 現行スキーマへ均すための任意フック (省略時は素通し)。
 */
export function collectionStore<
  Input,
  T extends Input & { id: string; createdAt: number },
>(
  kv: Kv,
  cfg: {
    /** キーの prefix (`["settings", <name>]`)。 */
    prefix: Deno.KvKey;
    /** 読み戻した値が T か判定する型ガード。 */
    isValid: (value: unknown) => value is T;
    /** 読み戻した値を現行スキーマへ均す (旧形状の補完)。省略時は素通し。 */
    normalize?: (value: unknown) => unknown;
    /** 並び順。既定は createdAt 降順 → id。 */
    sort?: (a: T, b: T) => number;
  },
): CollectionStore<T, Input> {
  const { prefix, isValid } = cfg;
  const normalize = cfg.normalize ?? ((value: unknown) => value);
  const sort = cfg.sort ??
    ((a: T, b: T) => b.createdAt - a.createdAt || a.id.localeCompare(b.id));
  const keyOf = (id: string): Deno.KvKey => [...prefix, id];

  return {
    async list() {
      const values = await kv.listValues(prefix);
      return values.map(normalize).filter(isValid).sort(sort);
    },
    async add(input, now = Date.now()) {
      const record = { ...input, id: crypto.randomUUID(), createdAt: now } as T;
      await kv.set(keyOf(record.id), record);
      return record;
    },
    async update(id, input) {
      const current = normalize(await kv.get(keyOf(id)));
      if (!isValid(current)) {
        return null;
      }
      const record = { ...input, id, createdAt: current.createdAt } as T;
      await kv.set(keyOf(id), record);
      return record;
    },
    remove(id) {
      return kv.remove(keyOf(id));
    },
  };
}

/** 単一キーに 1 値だけ持つシングルトン型ストア。 */
export type SingletonStore<T> = {
  /** 保存済みの値 (normalize 経由。未保存・不正値は normalize の既定値)。 */
  get(): Promise<T>;
  /** 値を全上書きで保存する。 */
  set(value: T): Promise<T>;
};

/**
 * シングルトン型ストアを生成する。読み戻しは normalize に通す
 * (旧形状の補完・既定値フォールバックは normalize の責務)。
 */
export function singletonStore<T>(
  kv: Kv,
  cfg: {
    /** 保存先のキー。 */
    key: Deno.KvKey;
    /** 読み戻した値を T に正規化する (既定値フォールバック込み)。 */
    normalize: (value: unknown) => T;
  },
): SingletonStore<T> {
  const { key, normalize } = cfg;
  return {
    async get() {
      return normalize(await kv.get(key));
    },
    async set(value) {
      await kv.set(key, value);
      return value;
    },
  };
}
