import { mkdir } from "node:fs/promises";
import { DatabaseSync as Database } from "node:sqlite";

/**
 * 設定系データの永続化基盤 (SQLite (`node:sqlite`) によるキー・値ストアの
 * ラッパーと汎用ストア)。
 *
 * - 置き場所は環境変数 `DATA_DIR` (既定 `./data`) 配下の `settings.sqlite3`。
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
  const dir = process.env.DATA_DIR?.trim().replace(/\/+$/, "");
  return dir ? dir : "./data";
}

/** 設定系データの SQLite ファイルパス (`${DATA_DIR}/settings.sqlite3`)。 */
export function kvPath(): string {
  return `${dataDir()}/settings.sqlite3`;
}

/** キー。要素の並びで階層を表す (`["settings", <name>, <id>]`)。 */
export type KvKey = readonly (string | number | boolean)[];

/** SQLite のキー・値ストアの薄いラッパー。lazy-open 状態はクロージャに閉じる。 */
export type Kv = {
  /** key の値。無ければ null。 */
  get(key: KvKey): Promise<unknown>;
  /** key に値を保存する。 */
  set(key: KvKey, value: unknown): Promise<void>;
  /** prefix 配下の値一覧 (キー順)。 */
  listValues(prefix: KvKey): Promise<unknown[]>;
  /** key を削除する。存在していたら true。 */
  remove(key: KvKey): Promise<boolean>;
  /** KV を閉じる (テスト用)。 */
  close(): Promise<void>;
};

/** キーを保存用の文字列にする (要素の JSON 配列)。 */
function encodeKey(key: KvKey): string {
  return JSON.stringify(key);
}

/**
 * prefix 配下のキーが共有する先頭文字列。`["a"]` 配下のキーは `["a",` で始まる。
 * 空 prefix は全キー (`[`)。
 */
function prefixOf(prefix: KvKey): string {
  return prefix.length === 0 ? "[" : `${encodeKey(prefix).slice(0, -1)},`;
}

/** Kv を生成する。path はテスト用に差し替え可能 (`":memory:"` など)。 */
export function createKv(path: string = kvPath()): Kv {
  let opened: Promise<Database> | null = null;
  const open = (): Promise<Database> => {
    if (opened === null) {
      opened = (async () => {
        // SQLite ファイルの親ディレクトリが無いと open が失敗する。
        const dir = path.replace(/\/[^/]*$/, "");
        if (dir !== "" && dir !== path) {
          await mkdir(dir, { recursive: true });
        }
        const db = new Database(path);
        db.exec(
          "CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL) WITHOUT ROWID",
        );
        return db;
      })();
    }
    return opened;
  };

  return {
    async get(key) {
      const db = await open();
      const row = db.prepare("SELECT value FROM kv WHERE key = ?").get(
        encodeKey(key),
      ) as { value: string } | undefined;
      return row === undefined ? null : JSON.parse(row.value);
    },
    async set(key, value) {
      const db = await open();
      db.prepare(
        "INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value",
      ).run(encodeKey(key), JSON.stringify(value));
    },
    async listValues(prefix) {
      const db = await open();
      const head = prefixOf(prefix);
      // substr は文字 (コードポイント) 単位で数えるため、長さもコードポイントで渡す。
      // LIKE は % / _ のエスケープが要るので使わない。
      const rows = db.prepare(
        "SELECT value FROM kv WHERE substr(key, 1, ?) = ? ORDER BY key",
      ).all([...head].length, head) as { value: string }[];
      return rows.map((row) => JSON.parse(row.value));
    },
    async remove(key) {
      const db = await open();
      const { changes } = db.prepare("DELETE FROM kv WHERE key = ?").run(
        encodeKey(key),
      );
      return Number(changes) > 0;
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
 * createdAt を持つ (`["settings", <name>, <id>]`)。ストアは id を自動採番
 * しないため、add で crypto.randomUUID() を採番する。
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
    prefix: KvKey;
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
  const keyOf = (id: string): KvKey => [...prefix, id];

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
    key: KvKey;
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
