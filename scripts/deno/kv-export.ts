/**
 * Deno KV の設定系データを JSON へ書き出すスクリプト (Node.js 移行用)。
 *
 * - Deno KV の値は Node の `v8.deserialize` では読めないため、Deno 自身の
 *   公式 API (`Deno.openKv` / `kv.list`) で読んで JSON にする。取り込みは
 *   移行先 (Node 版) のストアが行う
 * - 書き出すのは `["settings"]` 配下の全エントリ。KV には書き込まないので
 *   何度実行してもよい
 * - 実行: `deno task kv:export [<KV のパス> [<出力先>]]`
 *   省略時は `${DATA_DIR:-./data}/kv.sqlite3` を読み、同じディレクトリの
 *   `kv-export.json` へ書く
 * - **import 文を持たせない**。単体のファイルを Deno 同梱のコンテナへ
 *   マウントして実行するため (`Deno.*` と Web 標準 API だけを使う)
 */

/** 書き出し結果の形。取り込み側 (Node のストア) との約束なので変えない。 */
export type KvExport = {
  version: 1;
  /** 書き出した時刻 (epoch ミリ秒) */
  exportedAt: number;
  /** キー順 (kv.list の返す順) */
  entries: { key: (string | number | boolean)[]; value: unknown }[];
};

/**
 * 環境変数から既定のパスを決める。`DATA_DIR` の解決規則は
 * server/store/kv.ts の `dataDir()` と同じ (trim・末尾 `/` 除去・空なら `./data`)。
 */
export function defaultPaths(
  env: { get(key: string): string | undefined },
): { kvPath: string; outPath: string } {
  const dir = env.get("DATA_DIR")?.trim().replace(/\/+$/, "");
  const dataDir = dir ? dir : "./data";
  return {
    kvPath: `${dataDir}/kv.sqlite3`,
    outPath: `${dataDir}/kv-export.json`,
  };
}

/** KV を開いて `["settings"]` 配下の全エントリを読む。KV には書き込まない。 */
export async function exportKv(
  kvPath: string,
  now: number = Date.now(),
): Promise<KvExport> {
  // `Deno.openKv` は存在しないパスに新規作成してしまうため、先に存在を確認する。
  let stat: Deno.FileInfo;
  try {
    stat = await Deno.stat(kvPath);
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      throw new Error(`KV ファイルが見つからない: ${kvPath}`);
    }
    throw e;
  }
  if (!stat.isFile) {
    throw new Error(`KV ファイルではない: ${kvPath}`);
  }

  const kv = await Deno.openKv(kvPath);
  try {
    const entries: KvExport["entries"] = [];
    for await (const entry of kv.list({ prefix: ["settings"] })) {
      const key: (string | number | boolean)[] = [];
      for (const part of entry.key) {
        if (
          typeof part !== "string" && typeof part !== "number" &&
          typeof part !== "boolean"
        ) {
          throw new Error(
            `書き出せないキー要素 (${typeof part}): ${
              entry.key.map((p) => String(p)).join("/")
            }`,
          );
        }
        key.push(part);
      }
      entries.push({ key, value: entry.value });
    }
    return { version: 1, exportedAt: now, entries };
  } finally {
    kv.close();
  }
}

/** JSON を出力先へ書く。一時ファイルへ書いてから rename し、失敗時に既存の出力先を壊さない。 */
export async function writeExport(
  outPath: string,
  result: KvExport,
): Promise<void> {
  const json = JSON.stringify(result, null, 2) + "\n";
  const tmpPath = `${outPath}.tmp`;
  try {
    await Deno.writeTextFile(tmpPath, json);
    await Deno.rename(tmpPath, outPath);
  } catch (e) {
    // rename まで到達しなかった場合は一時ファイルを残さない (消す失敗は無視)。
    try {
      await Deno.remove(tmpPath);
    } catch {
      // 無視
    }
    throw e;
  }
}

if (import.meta.main) {
  try {
    const defaults = defaultPaths(Deno.env);
    const kvPath = Deno.args[0] ?? defaults.kvPath;
    const outPath = Deno.args[1] ?? defaults.outPath;

    const result = await exportKv(kvPath);
    // 一時ファイル経由で書く (失敗時に既存の出力先を壊さない)。
    await writeExport(outPath, result);
    console.log(`${result.entries.length} 件を ${outPath} へ書き出した`);
  } catch (e) {
    console.error(e instanceof Error ? e.message : String(e));
    Deno.exit(1);
  }
}
