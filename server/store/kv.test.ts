import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createKv, dataDir, kvPath } from "./kv.ts";

function withEnv(key: string, value: string | null, fn: () => void) {
  const original = process.env[key];
  try {
    if (value === null) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
    fn();
  } finally {
    if (original === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original;
    }
  }
}

test("dataDir: 未設定なら ./data", () => {
  withEnv("DATA_DIR", null, () => {
    assert.deepStrictEqual(dataDir(), "./data");
  });
});

test("dataDir: DATA_DIR を反映し末尾スラッシュを除く", () => {
  withEnv("DATA_DIR", "/var/lib/mirakc-ui/", () => {
    assert.deepStrictEqual(dataDir(), "/var/lib/mirakc-ui");
  });
});

test("kvPath: DATA_DIR 配下の settings.sqlite3", () => {
  withEnv("DATA_DIR", null, () => {
    assert.deepStrictEqual(kvPath(), "./data/settings.sqlite3");
  });
  withEnv("DATA_DIR", "/var/lib/mirakc-ui", () => {
    assert.deepStrictEqual(kvPath(), "/var/lib/mirakc-ui/settings.sqlite3");
  });
});

test("Kv: set / get / listValues / remove / close が動く", async () => {
  const kv = createKv(":memory:");
  try {
    assert.deepStrictEqual(await kv.get(["a", "1"]), null);

    await kv.set(["a", "1"], { v: 1 });
    await kv.set(["a", "2"], { v: 2 });
    await kv.set(["b", "1"], { v: 3 });

    assert.deepStrictEqual(await kv.get(["a", "1"]), { v: 1 });
    assert.deepStrictEqual(await kv.listValues(["a"]), [{ v: 1 }, { v: 2 }]);

    assert.deepStrictEqual(await kv.remove(["a", "1"]), true);
    assert.deepStrictEqual(await kv.remove(["a", "1"]), false);
    assert.deepStrictEqual(await kv.get(["a", "1"]), null);
  } finally {
    await kv.close();
  }
});

test("Kv: 同じディレクトリにファイルを作る (mkdir 込み)", async () => {
  const dir = await mkdtemp(join(tmpdir(), "mirakc-ui-kv-"));
  try {
    const kv = createKv(`${dir}/nested/kv.sqlite3`);
    await kv.set(["x"], 1);
    assert.deepStrictEqual(await kv.get(["x"]), 1);
    await kv.close();
    const s = await stat(`${dir}/nested/kv.sqlite3`);
    assert.deepStrictEqual(s.isFile(), true);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
