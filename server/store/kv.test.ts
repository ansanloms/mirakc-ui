import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdir, mkdtemp, rm, stat, symlink, writeFile } from "node:fs/promises";
import { DatabaseSync } from "node:sqlite";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createKv, dataDir, initDir, kvPath } from "./kv.ts";

async function withEnv(key: string, value: string | null, fn: () => void | Promise<void>) {
  const original = process.env[key];
  try {
    if (value === null) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
    await fn();
  } finally {
    if (original === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = original;
    }
  }
}

test("dataDir: 未設定なら ./data", async () => {
  await withEnv("DATA_DIR", null, () => {
    assert.deepStrictEqual(dataDir(), "./data");
  });
});

test("dataDir: DATA_DIR を反映し末尾スラッシュを除く", async () => {
  await withEnv("DATA_DIR", "/var/lib/mirakc-ui/", () => {
    assert.deepStrictEqual(dataDir(), "/var/lib/mirakc-ui");
  });
});

test("kvPath: DATA_DIR 配下の settings.sqlite3", async () => {
  await withEnv("DATA_DIR", null, () => {
    assert.deepStrictEqual(kvPath(), "./data/settings.sqlite3");
  });
  await withEnv("DATA_DIR", "/var/lib/mirakc-ui", () => {
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
    const kv = createKv(`${dir}/nested/kv.sqlite3`, { initDir: null });
    await kv.set(["x"], 1);
    assert.deepStrictEqual(await kv.get(["x"]), 1);
    await kv.close();
    const s = await stat(`${dir}/nested/kv.sqlite3`);
    assert.deepStrictEqual(s.isFile(), true);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

/** 一時ディレクトリを作って fn に渡し、終わったら消す。 */
async function withTmp(fn: (dir: string) => Promise<void>) {
  const dir = await mkdtemp(join(tmpdir(), "mirakc-ui-kv-"));
  try {
    await fn(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function exists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

test("initDir: DATA_INIT_DIR を反映し、未設定なら同梱の server/initdb.d", async () => {
  await withEnv("DATA_INIT_DIR", null, () => {
    assert.ok(initDir().endsWith("/server/initdb.d"));
  });
  await withEnv("DATA_INIT_DIR", "  ", () => {
    assert.ok(initDir().endsWith("/server/initdb.d"));
  });
  await withEnv("DATA_INIT_DIR", " /opt/init ", () => {
    assert.deepStrictEqual(initDir(), "/opt/init");
  });
});

test("init: 新規の DB で *.sql が名前の昇順に実行され、*.sql 以外は無視される", async () => {
  await withTmp(async (dir) => {
    const init = `${dir}/init`;
    await mkdir(init);
    await writeFile(`${init}/002-b.sql`, "INSERT INTO kv (key, value) VALUES ('[\"b\"]', '2');");
    await writeFile(
      `${init}/001-a.sql`,
      "INSERT INTO kv (key, value) VALUES ('[\"a\"]', '1'); CREATE TABLE seq (n TEXT); INSERT INTO seq VALUES ('a');",
    );
    await writeFile(`${init}/003-c.txt`, "this is not sql");
    await mkdir(`${init}/004-d.sql`);
    const kv = createKv(`${dir}/kv.sqlite3`, { initDir: init });
    try {
      await kv.open();
      assert.deepStrictEqual(await kv.get(["a"]), 1);
      assert.deepStrictEqual(await kv.get(["b"]), 2);
    } finally {
      await kv.close();
    }
  });
});

test("init: 既存の DB では実行されない", async () => {
  await withTmp(async (dir) => {
    const init = `${dir}/init`;
    await mkdir(init);
    await writeFile(`${init}/001.sql`, "INSERT INTO kv (key, value) VALUES ('[\"a\"]', '1');");
    const path = `${dir}/kv.sqlite3`;
    const first = createKv(path, { initDir: init });
    await first.open();
    await first.close();

    await writeFile(`${init}/001.sql`, "INSERT INTO kv (key, value) VALUES ('[\"z\"]', '9');");
    const second = createKv(path, { initDir: init });
    try {
      assert.deepStrictEqual(await second.get(["a"]), 1);
      assert.deepStrictEqual(await second.get(["z"]), null);
    } finally {
      await second.close();
    }
  });
});

test("init: :memory: では実行されない", async () => {
  await withTmp(async (dir) => {
    await writeFile(`${dir}/001.sql`, "INSERT INTO kv (key, value) VALUES ('[\"a\"]', '1');");
    const kv = createKv(":memory:", { initDir: dir });
    try {
      assert.deepStrictEqual(await kv.get(["a"]), null);
    } finally {
      await kv.close();
    }
  });
});

test("init: initDir が null・存在しないディレクトリ・*.sql 0 件なら何もせず開ける", async () => {
  await withTmp(async (dir) => {
    await mkdir(`${dir}/empty`);
    await writeFile(`${dir}/empty/readme.txt`, "x");
    const cases: (string | null)[] = [null, `${dir}/missing`, `${dir}/empty`];
    for (const [i, initDirOption] of cases.entries()) {
      const kv = createKv(`${dir}/kv-${i}.sqlite3`, { initDir: initDirOption });
      try {
        await kv.open();
        assert.deepStrictEqual(await kv.listValues([]), []);
      } finally {
        await kv.close();
      }
    }
  });
});

test("init: 壊れた SQL では open が reject し、直して開き直すと init が走る", async () => {
  await withTmp(async (dir) => {
    const init = `${dir}/init`;
    await mkdir(init);
    await writeFile(
      `${init}/001-bad.sql`,
      "INSERT INTO kv (key, value) VALUES ('[\"a\"]', '1'); THIS IS BROKEN;",
    );
    const path = `${dir}/kv.sqlite3`;
    const kv = createKv(path, { initDir: init });
    await assert.rejects(kv.open(), /001-bad\.sql/);
    await assert.rejects(kv.open(), /001-bad\.sql/);

    // 失敗後に kv テーブルが残っていない (次回に init がやり直される)。
    const probe = new DatabaseSync(path);
    try {
      const rows = probe.prepare("SELECT name FROM sqlite_master WHERE name = 'kv'").all();
      assert.deepStrictEqual(rows.length, 0);
    } finally {
      probe.close();
    }

    await writeFile(`${init}/001-bad.sql`, "INSERT INTO kv (key, value) VALUES ('[\"a\"]', '1');");
    try {
      assert.deepStrictEqual(await kv.get(["a"]), 1);
    } finally {
      await kv.close();
    }
  });
});

test("init: 後続の SQL が失敗すると先行ファイルの行も取り消され、直して開き直すと両方入る", async () => {
  await withTmp(async (dir) => {
    const init = `${dir}/init`;
    await mkdir(init);
    await writeFile(`${init}/001-ok.sql`, "INSERT INTO kv (key, value) VALUES ('[\"a\"]', '1');");
    await writeFile(`${init}/002-bad.sql`, "THIS IS BROKEN;");
    const path = `${dir}/kv.sqlite3`;
    const kv = createKv(path, { initDir: init });
    await assert.rejects(kv.open(), (e: Error) => e.message.includes(`${init}/002-bad.sql`));

    const probe = new DatabaseSync(path);
    try {
      const rows = probe.prepare("SELECT name FROM sqlite_master WHERE name = 'kv'").all();
      assert.deepStrictEqual(rows.length, 0);
    } finally {
      probe.close();
    }

    await writeFile(`${init}/002-bad.sql`, "INSERT INTO kv (key, value) VALUES ('[\"b\"]', '2');");
    try {
      assert.deepStrictEqual(await kv.get(["a"]), 1);
      assert.deepStrictEqual(await kv.get(["b"]), 2);
    } finally {
      await kv.close();
    }
  });
});

test("init: init ディレクトリを読めないと、そのパスを含む文言で open が reject する", async () => {
  await withTmp(async (dir) => {
    // ディレクトリのはずの場所がファイル (readdir は ENOTDIR で失敗する。root でも再現する)。
    const init = `${dir}/init`;
    await writeFile(init, "not a directory");
    const path = `${dir}/kv.sqlite3`;
    const kv = createKv(path, { initDir: init });
    await assert.rejects(
      kv.open(),
      (e: Error) =>
        e.message === `failed to read init SQL: ${init} (database: ${path})` &&
        e.cause !== undefined,
    );
  });
});

test("init: 空のファイルが先にあっても init が走る", async () => {
  await withTmp(async (dir) => {
    const init = `${dir}/init`;
    await mkdir(init);
    await writeFile(`${init}/001.sql`, "INSERT INTO kv (key, value) VALUES ('[\"a\"]', '1');");
    const path = `${dir}/kv.sqlite3`;
    await writeFile(path, "");
    const kv = createKv(path, { initDir: init });
    try {
      assert.deepStrictEqual(await kv.get(["a"]), 1);
    } finally {
      await kv.close();
    }
  });
});

test("init: symlink の *.sql は実行し、ディレクトリを指す symlink は無視する", async () => {
  await withTmp(async (dir) => {
    const init = `${dir}/init`;
    const real = `${dir}/real`;
    await mkdir(init);
    await mkdir(real);
    await mkdir(`${real}/dir`);
    await writeFile(`${real}/a.sql`, "INSERT INTO kv (key, value) VALUES ('[\"a\"]', '1');");
    await symlink(`${real}/a.sql`, `${init}/001-link.sql`);
    await symlink(`${real}/dir`, `${init}/002-dir.sql`);
    await symlink(`${real}/missing.sql`, `${init}/003-broken.sql`);
    const kv = createKv(`${dir}/kv.sqlite3`, { initDir: init });
    try {
      assert.deepStrictEqual(await kv.get(["a"]), 1);
    } finally {
      await kv.close();
    }
  });
});

test("init: 失敗しても既存の DB の中身は保たれる", async () => {
  await withTmp(async (dir) => {
    const path = `${dir}/kv.sqlite3`;
    const first = createKv(path, { initDir: null });
    await first.set(["keep"], 1);
    await first.close();

    const init = `${dir}/init`;
    await mkdir(init);
    await writeFile(`${init}/001.sql`, "BROKEN;");
    const second = createKv(path, { initDir: init });
    // kv テーブルがある DB では init を実行しないので失敗せず、中身も残る。
    try {
      assert.deepStrictEqual(await second.get(["keep"]), 1);
    } finally {
      await second.close();
    }
    assert.deepStrictEqual(await exists(path), true);
  });
});

test("init: 既定の initDir は DATA_INIT_DIR で変わる", async () => {
  await withTmp(async (dir) => {
    const init = `${dir}/init`;
    await mkdir(init);
    await writeFile(`${init}/001.sql`, "INSERT INTO kv (key, value) VALUES ('[\"env\"]', '7');");
    await withEnv("DATA_INIT_DIR", init, async () => {
      const kv = createKv(`${dir}/kv.sqlite3`);
      try {
        assert.deepStrictEqual(await kv.get(["env"]), 7);
      } finally {
        await kv.close();
      }
    });
  });
});
