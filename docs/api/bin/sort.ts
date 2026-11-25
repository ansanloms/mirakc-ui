import { readFile, writeFile } from "node:fs/promises";
import * as path from "node:path";
import { parseArgs } from "node:util";
import * as yaml from "yaml";
import type { OpenAPIV3_1 } from "openapi-types";

const { values } = parseArgs({
  options: { target: { type: "string", default: path.join(import.meta.dirname, "../api.yaml") } },
});

const SCHEMA_PREFIXES = ["Enum", "Request", "Response"];

const cmp = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

const sortKeys = <T>(source: Record<string, T>, compare?: (a: string, b: string) => number) =>
  Object.fromEntries(
    Object.keys(source)
      .sort(compare)
      .map((key) => [key, source[key]]),
  );

// 接頭辞の群に入るのは、接頭辞の直後が ASCII の大文字 (A-Z) の名前だけ (EnumStatus 等)。
// Requester・Enum・Response200・Enum_b は、接頭辞なしの群に入る。
const weight = (name: string) =>
  `${SCHEMA_PREFIXES.findIndex((prefix) => name.startsWith(prefix) && /^[A-Z]/.test(name.slice(prefix.length))) + 1}${name}`;

const apiDoc = yaml.parse(await readFile(values.target, "utf8")) as OpenAPIV3_1.Document;
const { components } = apiDoc;

if (apiDoc.paths) {
  apiDoc.paths = sortKeys(apiDoc.paths);
}
if (components?.schemas) {
  components.schemas = sortKeys(components.schemas, (a, b) => cmp(weight(a), weight(b)));
}
if (components?.securitySchemes) {
  components.securitySchemes = sortKeys(components.securitySchemes);
}

await writeFile(values.target, yaml.stringify(apiDoc, { lineWidth: -1 }));
