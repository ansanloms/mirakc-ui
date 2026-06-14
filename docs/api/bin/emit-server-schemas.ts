/**
 * バンドル済み OpenAPI (JSON) の `components.schemas` を抽出し、サーバが
 * import できる TypeScript モジュールとして書き出す。
 *
 * docs/api の OpenAPI を単一ソースとし、サーバ側の「型 (json-schema-to-ts の
 * FromSchema)」と「検証 (@cfworker/json-schema)」を 1 枚の component schema
 * から得るための成果物を生成する。`deno task generate:internal` から
 * `--cwd ./docs/api emit-server-schemas <出力先>` の形で呼ばれる。
 *
 * 生成物は自動生成物のため fmt / lint からは除外する (deno.json の exclude)。
 *
 * usage: emit-server-schemas.ts <input api.json> <output .ts>
 */
import * as path from "@std/path";

const [inputPath, outputPath] = Deno.args;
if (!inputPath || !outputPath) {
  console.error(
    "usage: emit-server-schemas.ts <input api.json> <output .ts>",
  );
  Deno.exit(1);
}

const spec = JSON.parse(await Deno.readTextFile(inputPath));
const schemas = spec?.components?.schemas ?? {};

const header =
  `// This file was auto-generated from the OpenAPI definition in docs/api.
// Do not make direct changes to the file. Run \`deno task generate:internal\`.
//
// docs/api の component schema (= JSON Schema)。サーバはこれ 1 枚から
// 型 (json-schema-to-ts の FromSchema) と検証 (@cfworker/json-schema) を得る。
`;

const body = `export const internalSchemas = ${
  JSON.stringify(schemas, null, 2)
} as const;\n`;

await Deno.mkdir(path.dirname(outputPath), { recursive: true });
await Deno.writeTextFile(outputPath, `${header}\n${body}`);
console.log(`emitted: ${outputPath} (${Object.keys(schemas).length} schemas)`);
