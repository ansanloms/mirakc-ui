import { assertEquals, assertRejects } from "@std/assert";
import {
  defaultPaths,
  exportKv,
  type KvExport,
  writeExport,
} from "./kv-export.ts";

function envOf(values: Record<string, string>) {
  return { get: (key: string) => values[key] };
}

Deno.test("defaultPaths: DATA_DIR 未設定なら ./data", () => {
  assertEquals(defaultPaths(envOf({})), {
    kvPath: "./data/kv.sqlite3",
    outPath: "./data/kv-export.json",
  });
});

Deno.test("defaultPaths: DATA_DIR を反映し末尾スラッシュを除く", () => {
  assertEquals(defaultPaths(envOf({ DATA_DIR: "/var/lib/mirakc-ui/" })), {
    kvPath: "/var/lib/mirakc-ui/kv.sqlite3",
    outPath: "/var/lib/mirakc-ui/kv-export.json",
  });
});

Deno.test("defaultPaths: 空文字・空白だけなら未設定と同じ", () => {
  for (const value of ["", "   "]) {
    assertEquals(defaultPaths(envOf({ DATA_DIR: value })), {
      kvPath: "./data/kv.sqlite3",
      outPath: "./data/kv-export.json",
    });
  }
});

/** 一時ディレクトリに KV を作って値を入れ、close する。 */
async function seed(
  dir: string,
  items: [Deno.KvKey, unknown][],
): Promise<string> {
  const path = `${dir}/kv.sqlite3`;
  const kv = await Deno.openKv(path);
  try {
    for (const [key, value] of items) {
      await kv.set(key, value);
    }
  } finally {
    kv.close();
  }
  return path;
}

/** KV の ["settings"] 配下を (キー, 値) で全件読む。 */
async function dump(path: string) {
  const kv = await Deno.openKv(path);
  try {
    const out: { key: Deno.KvKey; value: unknown }[] = [];
    for await (const e of kv.list({ prefix: ["settings"] })) {
      out.push({ key: e.key, value: e.value });
    }
    return out;
  } finally {
    kv.close();
  }
}

const notification = {
  url: "https://ntfy.sh/mirakc-rec",
  token: "",
  onSchedule: true,
  onStart: false,
  onEnd: false,
  onFail: true,
  onRemove: false,
};
const rule1 = {
  id: "uuid1",
  keyword: "ニュース",
  from: undefined,
  to: undefined,
  channels: [],
  genres: [],
  enabled: true,
};
const rule2 = {
  id: "uuid2",
  keyword: "アニメ",
  from: "2026-01-01",
  to: "2026-03-31",
  channels: ["27"],
  genres: [7],
  enabled: false,
};
const liveComment = {
  assignments: [{ serviceId: 1, channelId: "jk1", enabled: true }],
};

Deno.test("exportKv: settings 配下だけを kv.list の順で書き出す", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const path = await seed(dir, [
      [["settings", "notification"], notification],
      [["settings", "keyword-rules", "uuid1"], rule1],
      [["settings", "keyword-rules", "uuid2"], rule2],
      [["settings", "live-comment", "uuid3"], liveComment],
      [["settings", "live-comment"], { nicolive: [] }],
      [["other", "x"], { a: 1 }],
    ]);
    const expected = await dump(path);

    const result = await exportKv(path, 1234);

    assertEquals(result.version, 1);
    assertEquals(result.exportedAt, 1234);
    assertEquals(result.entries.length, 5);
    assertEquals(
      result.entries.map((e) => e.key),
      expected.map((e) => [...e.key]),
    );
    assertEquals(
      result.entries.some((e) => e.key[0] === "other"),
      false,
    );
    assertEquals(
      result.entries.map((e) => e.value),
      expected.map((e) => e.value),
    );

    const json = JSON.parse(JSON.stringify(result));
    const r1 = json.entries.find((e: { key: string[] }) =>
      e.key[2] === "uuid1"
    ).value;
    assertEquals("from" in r1, false);
    assertEquals("to" in r1, false);
    const r2 = json.entries.find((e: { key: string[] }) =>
      e.key[2] === "uuid2"
    ).value;
    assertEquals(r2.keyword, "アニメ");
    assertEquals(r2.from, "2026-01-01");
    assertEquals(r2.to, "2026-03-31");
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("exportKv: KV に書き込まない", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const path = await seed(dir, [
      [["settings", "notification"], notification],
      [["settings", "keyword-rules", "uuid2"], rule2],
    ]);
    const before = await dump(path);
    await exportKv(path);
    const after = await dump(path);
    assertEquals(after, before);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("exportKv: 存在しないパスは reject しファイルを作らない", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const path = `${dir}/missing.sqlite3`;
    await assertRejects(() => exportKv(path), Error, path);
    let exists = true;
    try {
      await Deno.stat(path);
    } catch (e) {
      if (e instanceof Deno.errors.NotFound) {
        exists = false;
      } else {
        throw e;
      }
    }
    assertEquals(exists, false);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("exportKv: ディレクトリのパスは reject し中身を増やさない", async () => {
  const dir = await Deno.makeTempDir();
  try {
    await assertRejects(() => exportKv(dir), Error, dir);
    const names: string[] = [];
    for await (const e of Deno.readDir(dir)) {
      names.push(e.name);
    }
    assertEquals(names, []);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

const sampleExport: KvExport = {
  version: 1,
  exportedAt: 1,
  entries: [{ key: ["settings", "a"], value: { x: 1 } }],
};

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch (e) {
    if (e instanceof Deno.errors.NotFound) {
      return false;
    }
    throw e;
  }
}

Deno.test("writeExport: JSON として書き一時ファイルを残さない", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const outPath = `${dir}/out.json`;
    await writeExport(outPath, sampleExport);
    assertEquals(JSON.parse(await Deno.readTextFile(outPath)), sampleExport);
    assertEquals(await exists(`${outPath}.tmp`), false);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("writeExport: 既存の出力ファイルを上書きできる", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const outPath = `${dir}/out.json`;
    await Deno.writeTextFile(outPath, "old");
    await writeExport(outPath, sampleExport);
    assertEquals(JSON.parse(await Deno.readTextFile(outPath)), sampleExport);
    assertEquals(await exists(`${outPath}.tmp`), false);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("writeExport: 一時ファイルへの書き込みに失敗しても既存の出力先を変えない", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const outPath = `${dir}/kv-export.json`;
    await Deno.writeTextFile(outPath, "keep");
    // 一時ファイルのパスをディレクトリで塞ぎ、一時ファイルへの書き込みを失敗させる。
    await Deno.mkdir(`${outPath}.tmp`);
    await assertRejects(() =>
      writeExport(outPath, {
        version: 1,
        exportedAt: 2,
        entries: [{ key: ["settings", "b"], value: { y: 2 } }],
      })
    );
    assertEquals(await Deno.readTextFile(outPath), "keep");
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("exportKv: number / boolean の要素を持つキーはそのまま書き出す", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const path = await seed(dir, [[["settings", 42, true], "v"]]);
    const result = await exportKv(path);
    assertEquals(result.entries, [{ key: ["settings", 42, true], value: "v" }]);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("exportKv: bigint の要素を持つキーは reject する", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const path = await seed(dir, [[["settings", 1n], "v"]]);
    await assertRejects(() => exportKv(path), Error, "settings");
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});

Deno.test("CLI: 書き出しと失敗時の終了コード", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const script = new URL("./kv-export.ts", import.meta.url).pathname;
    const run = async (kvPath: string, outPath: string) => {
      const out = await new Deno.Command(Deno.execPath(), {
        args: [
          "run",
          "--allow-read",
          "--allow-write",
          "--allow-env",
          "--unstable-kv",
          script,
          kvPath,
          outPath,
        ],
        stdout: "piped",
        stderr: "piped",
      }).output();
      return out.code;
    };

    const kvPath = await seed(dir, [
      [["settings", "notification"], notification],
      [["settings", "keyword-rules", "uuid2"], rule2],
    ]);
    const outPath = `${dir}/out.json`;
    assertEquals(await run(kvPath, outPath), 0);
    const parsed = JSON.parse(await Deno.readTextFile(outPath));
    assertEquals(parsed.entries.length, 2);

    const missingOut = `${dir}/missing-out.json`;
    assertEquals(await run(`${dir}/nope.sqlite3`, missingOut), 1);
    let exists = true;
    try {
      await Deno.stat(missingOut);
    } catch (e) {
      if (e instanceof Deno.errors.NotFound) {
        exists = false;
      } else {
        throw e;
      }
    }
    assertEquals(exists, false);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});
