import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { test } from "node:test";
import * as yaml from "yaml";

const script = path.join(import.meta.dirname, "sort.ts");

// fixture を一時ファイルに書いて sort.ts を実行し、書き換え後のファイルの内容を返す。
const runSort = (doc: unknown, times = 1) => {
  const dir = mkdtempSync(path.join(tmpdir(), "sort-test-"));
  try {
    const target = path.join(dir, "api.yaml");
    writeFileSync(target, yaml.stringify(doc));
    const contents: string[] = [];
    for (let i = 0; i < times; i++) {
      execFileSync(process.execPath, [script, "--target", target], { encoding: "utf8" });
      contents.push(readFileSync(target, "utf8"));
    }
    return contents;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

const sortOnce = (doc: unknown) => yaml.parse(runSort(doc)[0]);

const empty = () => ({ type: "object" });

test("paths のキーが既定順に並ぶ", () => {
  const result = sortOnce({
    openapi: "3.1.0",
    paths: { "/c": {}, "/a": {}, "/b": {} },
  });
  assert.deepEqual(Object.keys(result.paths), ["/a", "/b", "/c"]);
});

test("components.schemas が接頭辞なし、Enum、Request、Response の順で、群内は名前順に並ぶ", () => {
  const result = sortOnce({
    openapi: "3.1.0",
    components: {
      schemas: {
        ResponseB: empty(),
        ResponseA: empty(),
        RequestB: empty(),
        RequestA: empty(),
        EnumB: empty(),
        EnumA: empty(),
        Zeta: empty(),
        Alpha: empty(),
      },
    },
  });
  assert.deepEqual(Object.keys(result.components.schemas), [
    "Alpha",
    "Zeta",
    "EnumA",
    "EnumB",
    "RequestA",
    "RequestB",
    "ResponseA",
    "ResponseB",
  ]);
});

test("components.securitySchemes のキーが既定順に並ぶ", () => {
  const result = sortOnce({
    openapi: "3.1.0",
    components: {
      securitySchemes: {
        cookieAuth: { type: "apiKey", in: "cookie", name: "sid" },
        apiKey: { type: "apiKey", in: "header", name: "X-Key" },
        bearerAuth: { type: "http", scheme: "bearer" },
      },
    },
  });
  assert.deepEqual(Object.keys(result.components.securitySchemes), [
    "apiKey",
    "bearerAuth",
    "cookieAuth",
  ]);
});

test("2 回続けて実行しても 1 回目の結果から内容が変わらない", () => {
  const [first, second] = runSort(
    {
      openapi: "3.1.0",
      paths: { "/b": {}, "/a": {} },
      components: {
        schemas: { ResponseA: empty(), Zeta: empty(), EnumA: empty(), Alpha: empty() },
        securitySchemes: {
          b: { type: "http", scheme: "basic" },
          a: { type: "http", scheme: "basic" },
        },
      },
    },
    2,
  );
  assert.equal(second, first);
  const parsed = yaml.parse(first);
  assert.deepEqual(Object.keys(parsed.paths), ["/a", "/b"]);
  assert.deepEqual(Object.keys(parsed.components.schemas), ["Alpha", "Zeta", "EnumA", "ResponseA"]);
  assert.deepEqual(Object.keys(parsed.components.securitySchemes), ["a", "b"]);
});

test("長い文字列が折り返されずに 1 行で出力される", () => {
  const long = Array.from({ length: 40 }, (_, i) => `word${i}`).join(" ");
  const [contents] = runSort({
    openapi: "3.1.0",
    info: { title: "Test", version: "1.0.0", description: long },
    paths: { "/b": {}, "/a": {} },
  });
  assert.ok(long.length > 200);
  assert.ok(contents.includes(long));
});

test("paths と components 以外のトップレベルのキーの値と順序が保たれる", () => {
  const info = { title: "Test", version: "1.0.0" };
  const servers = [{ url: "https://example.com" }];
  const result = sortOnce({
    openapi: "3.1.0",
    info,
    servers,
    paths: { "/b": {}, "/a": {} },
    tags: [{ name: "z" }, { name: "a" }],
  });
  assert.deepEqual(Object.keys(result), ["openapi", "info", "servers", "paths", "tags"]);
  assert.equal(result.openapi, "3.1.0");
  assert.deepEqual(result.info, info);
  assert.deepEqual(result.servers, servers);
  assert.deepEqual(result.tags, [{ name: "z" }, { name: "a" }]);
});

test("components が無い文書でもエラーにならず paths が並び替わる", () => {
  const result = sortOnce({ openapi: "3.1.0", paths: { "/b": {}, "/a": {} } });
  assert.deepEqual(Object.keys(result.paths), ["/a", "/b"]);
  assert.equal("components" in result, false);
});
