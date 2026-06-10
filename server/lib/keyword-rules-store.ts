/**
 * キーワード自動録画ルールの Deno KV 永続化。
 *
 * 設定系データは KV (SQLite バックエンド) に集約する方針。ファイルパスは
 * `./data/kv.sqlite3` 固定 (Docker 運用では /app/data を volume にする)。
 * キーは `["settings", "keyword-rules", <id>]` — 今後の設定系も
 * `["settings", ...]` 名前空間に追加していく。
 */

import {
  isKeywordRule,
  type KeywordRule,
  type KeywordRuleInput,
} from "./keyword-rules.ts";

/** KV (SQLite) の固定パス。 */
export const KV_PATH = "./data/kv.sqlite3";

const PREFIX = ["settings", "keyword-rules"] as const;

function keyOf(id: string): Deno.KvKey {
  return [...PREFIX, id];
}

/** キーワードルールの Deno KV ストア。 */
export class KeywordRuleStore {
  #path: string;
  #kv: Promise<Deno.Kv> | null = null;

  /** path はテスト用に差し替え可能 (`":memory:"` など)。既定は KV_PATH。 */
  constructor(path: string = KV_PATH) {
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

  /** 保存済みルールの一覧 (登録の新しい順)。 */
  async list(): Promise<KeywordRule[]> {
    const kv = await this.#open();
    const rules: KeywordRule[] = [];
    for await (const entry of kv.list({ prefix: [...PREFIX] })) {
      if (isKeywordRule(entry.value)) {
        rules.push(entry.value);
      }
    }
    return rules.sort(
      (a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id),
    );
  }

  /** ルールを追加する。 */
  async add(
    input: KeywordRuleInput,
    now: number = Date.now(),
  ): Promise<KeywordRule> {
    const rule: KeywordRule = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
    };
    const kv = await this.#open();
    await kv.set(keyOf(rule.id), rule);
    return rule;
  }

  /** 既存ルールを上書きする。id / createdAt は維持。無ければ null。 */
  async update(
    id: string,
    input: KeywordRuleInput,
  ): Promise<KeywordRule | null> {
    const kv = await this.#open();
    const current = await kv.get(keyOf(id));
    if (!isKeywordRule(current.value)) {
      return null;
    }
    const rule: KeywordRule = {
      ...input,
      id,
      createdAt: current.value.createdAt,
    };
    await kv.set(keyOf(id), rule);
    return rule;
  }

  /** id 一致のルールを削除する。削除したら true、見つからなければ false。 */
  async remove(id: string): Promise<boolean> {
    const kv = await this.#open();
    const current = await kv.get(keyOf(id));
    if (current.versionstamp === null) {
      return false;
    }
    await kv.delete(keyOf(id));
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
