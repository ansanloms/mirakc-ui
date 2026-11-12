import { readFileSync } from "node:fs";
import * as path from "node:path";
import { parseArgs } from "node:util";
import * as yaml from "yaml";

const methods = ["get", "put", "post", "delete", "options", "head", "patch", "trace"];

const { values } = parseArgs({
  options: {
    target: { type: "string", default: path.join(import.meta.dirname, "../dist/api.yaml") },
  },
});

const spec = yaml.parse(readFileSync(values.target, "utf8")) as Record<string, any>;

const getRefs = (obj: unknown): string[] =>
  Object.entries(obj ?? {}).flatMap(([k, v]) =>
    k === "$ref" && typeof v === "string" ? [v] : v && typeof v === "object" ? getRefs(v) : [],
  );

// $ref を、エスケープ復元済みの JSON Pointer セグメント配列に直す。
const toSegments = (ref: string) =>
  ref
    .slice(2)
    .split("/")
    .map((s) => s.replaceAll("~1", "/").replaceAll("~0", "~"));

// bundle 済み文書のルートから引く。
const resolve = (ref: string): unknown =>
  toSegments(ref).reduce<any>((node, key) => node?.[key], spec);

// $ref を推移的に辿り、到達した components.schemas の名前を返す。訪問済み集合で循環を止める。
const collect = (obj: unknown) => {
  const seen = new Set<string>();
  const walk = (node: unknown) => {
    for (const ref of getRefs(node).filter((r) => r.startsWith("#/"))) {
      if (!seen.has(ref)) {
        seen.add(ref);
        walk(resolve(ref));
      }
    }
  };
  walk(obj);
  const names = [...seen]
    .map(toSegments)
    .filter((s) => s.length >= 3 && s[0] === "components" && s[1] === "schemas")
    .map((s) => s[2]);
  return [...new Set(names)].sort();
};

const result = Object.entries<any>(spec.paths ?? {}).flatMap(([endpoint, item]) =>
  Object.entries<any>(item)
    .filter(([method]) => methods.includes(method))
    .map(([method, operation]) => ({
      method: method.toUpperCase(),
      path: endpoint,
      operationId: operation.operationId,
      summary: operation.summary,
      schemas: collect([item.parameters, operation]),
    })),
);

result.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));

console.info(JSON.stringify(result, null, 2));
