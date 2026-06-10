import { assertEquals } from "@std/assert";
import { dataDir, Kv, kvPath } from "./kv.ts";

function withEnv(key: string, value: string | null, fn: () => void) {
  const original = Deno.env.get(key);
  try {
    if (value === null) {
      Deno.env.delete(key);
    } else {
      Deno.env.set(key, value);
    }
    fn();
  } finally {
    if (original === undefined) {
      Deno.env.delete(key);
    } else {
      Deno.env.set(key, original);
    }
  }
}

Deno.test("dataDir: 未設定なら ./data", () => {
  withEnv("DATA_DIR", null, () => {
    assertEquals(dataDir(), "./data");
  });
});

Deno.test("dataDir: DATA_DIR を反映し末尾スラッシュを除く", () => {
  withEnv("DATA_DIR", "/var/lib/mirakc-ui/", () => {
    assertEquals(dataDir(), "/var/lib/mirakc-ui");
  });
});

Deno.test("kvPath: DATA_DIR 配下の kv.sqlite3", () => {
  withEnv("DATA_DIR", null, () => {
    assertEquals(kvPath(), "./data/kv.sqlite3");
  });
  withEnv("DATA_DIR", "/var/lib/mirakc-ui", () => {
    assertEquals(kvPath(), "/var/lib/mirakc-ui/kv.sqlite3");
  });
});

Deno.test("Kv: set / get / listValues / remove / close が動く", async () => {
  const kv = new Kv(":memory:");
  try {
    assertEquals(await kv.get(["a", "1"]), null);

    await kv.set(["a", "1"], { v: 1 });
    await kv.set(["a", "2"], { v: 2 });
    await kv.set(["b", "1"], { v: 3 });

    assertEquals(await kv.get(["a", "1"]), { v: 1 });
    assertEquals(await kv.listValues(["a"]), [{ v: 1 }, { v: 2 }]);

    assertEquals(await kv.remove(["a", "1"]), true);
    assertEquals(await kv.remove(["a", "1"]), false);
    assertEquals(await kv.get(["a", "1"]), null);
  } finally {
    await kv.close();
  }
});

Deno.test("Kv: 同じディレクトリにファイルを作る (mkdir 込み)", async () => {
  const dir = await Deno.makeTempDir();
  try {
    const kv = new Kv(`${dir}/nested/kv.sqlite3`);
    await kv.set(["x"], 1);
    assertEquals(await kv.get(["x"]), 1);
    await kv.close();
    const stat = await Deno.stat(`${dir}/nested/kv.sqlite3`);
    assertEquals(stat.isFile, true);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
});
