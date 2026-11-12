import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { test } from "node:test";
import * as yaml from "yaml";

const script = path.join(import.meta.dirname, "search.ts");

type Entry = {
  method: string;
  path: string;
  operationId: string;
  summary: string;
  schemas: string[];
};

// bundle 済みを想定した fixture を一時ファイルに書いて search.ts を実行し、標準出力の JSON を返す。
const runSearch = (spec: unknown): Entry[] => {
  const dir = mkdtempSync(path.join(tmpdir(), "search-test-"));
  try {
    const target = path.join(dir, "api.yaml");
    writeFileSync(target, yaml.stringify(spec));
    const stdout = execFileSync(process.execPath, [script, "--target", target], {
      encoding: "utf8",
    });
    return JSON.parse(stdout);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};

const empty = () => ({ type: "object" });

const ref = (name: string) => ({ $ref: `#/components/schemas/${name}` });

const okResponse = (schema: unknown) => ({
  "200": { description: "ok", content: { "application/json": { schema } } },
});

const find = (entries: Entry[], method: string, endpoint: string) => {
  const entry = entries.find((e) => e.method === method && e.path === endpoint);
  assert.ok(entry, `${method} ${endpoint} が出力に無い`);
  return entry;
};

test("各要素が method (大文字)、path、operationId、summary、schemas を持つ", () => {
  const result = runSearch({
    openapi: "3.1.0",
    paths: {
      "/users": {
        get: { operationId: "listUsers", summary: "一覧", responses: okResponse(ref("User")) },
      },
    },
    components: { schemas: { User: { type: "object" } } },
  });
  assert.deepEqual(result, [
    {
      method: "GET",
      path: "/users",
      operationId: "listUsers",
      summary: "一覧",
      schemas: ["User"],
    },
  ]);
});

test("直接参照と 3 段以上の推移参照の schema がすべて schemas に入る", () => {
  const result = runSearch({
    openapi: "3.1.0",
    paths: {
      "/a": { get: { operationId: "a", summary: "a", responses: okResponse(ref("A")) } },
    },
    components: {
      schemas: {
        A: { type: "object", properties: { b: ref("B") } },
        B: { type: "object", properties: { c: ref("C") } },
        C: { type: "object", properties: { d: ref("D") } },
        D: { type: "object" },
        Unused: { type: "object" },
      },
    },
  });
  assert.deepEqual(find(result, "GET", "/a").schemas, ["A", "B", "C", "D"]);
});

test("循環参照と自己参照があっても停止し、関係する schema が 1 回ずつ入る", () => {
  const result = runSearch({
    openapi: "3.1.0",
    paths: {
      "/a": { get: { operationId: "a", summary: "a", responses: okResponse(ref("A")) } },
      "/s": { get: { operationId: "s", summary: "s", responses: okResponse(ref("Self")) } },
    },
    components: {
      schemas: {
        A: { type: "object", properties: { b: ref("B") } },
        B: { type: "object", properties: { a: ref("A") } },
        Self: { type: "object", properties: { child: ref("Self") } },
      },
    },
  });
  assert.deepEqual(find(result, "GET", "/a").schemas, ["A", "B"]);
  assert.deepEqual(find(result, "GET", "/s").schemas, ["Self"]);
});

test("path item 直下の parameters が参照する schema は、その path の全 operation に入り他の path には入らない", () => {
  const result = runSearch({
    openapi: "3.1.0",
    paths: {
      "/items/{id}": {
        parameters: [{ name: "id", in: "path", required: true, schema: ref("ItemId") }],
        get: { operationId: "getItem", summary: "取得", responses: okResponse(ref("Item")) },
        delete: {
          operationId: "deleteItem",
          summary: "削除",
          responses: { "204": { description: "ok" } },
        },
      },
      "/other": {
        get: { operationId: "other", summary: "他", responses: okResponse(ref("Item")) },
      },
    },
    components: {
      schemas: { ItemId: { type: "string" }, Item: { type: "object" } },
    },
  });
  assert.deepEqual(find(result, "GET", "/items/{id}").schemas, ["Item", "ItemId"]);
  assert.deepEqual(find(result, "DELETE", "/items/{id}").schemas, ["ItemId"]);
  assert.deepEqual(find(result, "GET", "/other").schemas, ["Item"]);
});

test("schema 内部を指す参照では所有 schema が schemas に入る", () => {
  const result = runSearch({
    openapi: "3.1.0",
    paths: {
      "/u": {
        get: {
          operationId: "u",
          summary: "u",
          responses: okResponse({ $ref: "#/components/schemas/User/properties/status" }),
        },
      },
    },
    components: {
      schemas: {
        User: { type: "object", properties: { status: { type: "string" } } },
      },
    },
  });
  assert.deepEqual(find(result, "GET", "/u").schemas, ["User"]);
});

test("parameters や responses を経由した先の schema が入り、経由した名前は入らない", () => {
  const result = runSearch({
    openapi: "3.1.0",
    paths: {
      "/v": {
        get: {
          operationId: "v",
          summary: "v",
          parameters: [{ $ref: "#/components/parameters/Limit" }],
          responses: { "200": { $ref: "#/components/responses/Done" } },
        },
      },
    },
    components: {
      parameters: { Limit: { name: "limit", in: "query", schema: ref("LimitValue") } },
      responses: {
        Done: {
          description: "ok",
          content: { "application/json": { schema: ref("Result") } },
        },
      },
      schemas: { LimitValue: { type: "integer" }, Result: { type: "object" } },
    },
  });
  const schemas = find(result, "GET", "/v").schemas;
  assert.deepEqual(schemas, ["LimitValue", "Result"]);
  assert.equal(schemas.includes("Limit"), false);
  assert.equal(schemas.includes("Done"), false);
});

test("path item の HTTP メソッド以外のキーは operation として出力されない", () => {
  const result = runSearch({
    openapi: "3.1.0",
    paths: {
      "/p": {
        summary: "path の概要",
        description: "path の説明",
        parameters: [{ name: "q", in: "query", schema: { type: "string" } }],
        post: { operationId: "p", summary: "p", responses: { "200": { description: "ok" } } },
      },
    },
  });
  assert.deepEqual(
    result.map((e) => [e.method, e.path]),
    [["POST", "/p"]],
  );
});

test("配列が path、method の順に並び、各 schemas は名前順で重複が無い", () => {
  const op = (id: string, schemas: string[]) => ({
    operationId: id,
    summary: id,
    responses: okResponse({ oneOf: schemas.map(ref) }),
  });
  const result = runSearch({
    openapi: "3.1.0",
    paths: {
      "/b": { post: op("bPost", ["Z", "A"]), get: op("bGet", ["A"]) },
      "/a": { put: op("aPut", ["M", "B", "M/properties/x", "A"]), delete: op("aDelete", ["A"]) },
    },
    components: {
      schemas: {
        A: empty(),
        B: empty(),
        M: { type: "object", properties: { x: { type: "string" } } },
        Z: empty(),
      },
    },
  });
  assert.deepEqual(
    result.map((e) => `${e.method} ${e.path}`),
    ["DELETE /a", "PUT /a", "GET /b", "POST /b"],
  );
  assert.deepEqual(find(result, "PUT", "/a").schemas, ["A", "B", "M"]);
  assert.deepEqual(find(result, "POST", "/b").schemas, ["A", "Z"]);
});

test("解決できない $ref と #/ で始まらない $ref があってもエラーにならない", () => {
  const result = runSearch({
    openapi: "3.1.0",
    paths: {
      "/m": {
        get: {
          operationId: "m",
          summary: "m",
          responses: okResponse({
            allOf: [
              ref("Missing"),
              { $ref: "#/components/schemas/Present" },
              { $ref: "./external.yaml#/Foo" },
            ],
          }),
        },
      },
    },
    components: { schemas: { Present: { type: "object" } } },
  });
  const schemas = find(result, "GET", "/m").schemas;
  assert.ok(schemas.includes("Present"));
});
