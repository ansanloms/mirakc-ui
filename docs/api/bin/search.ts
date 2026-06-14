import * as fs from "@std/fs";
import * as path from "@std/path";
import * as yaml from "yaml";
import { cli, define } from "@gunshi/gunshi";
import pc from "picocolors";

const __dirname = path.dirname(path.fromFileUrl(import.meta.url));
const schemaDir = path.resolve(path.join(__dirname, "../components/schemas"));
const pathDir = path.resolve(path.join(__dirname, "../paths"));

const getSchemaObject = (schema: string) => {
  return yaml.parse(
    Deno.readTextFileSync(path.join(schemaDir, `${schema}.yaml`)),
  ) as object;
};

const getRefs = (obj: object): string[] => {
  const refs = Object.entries(obj)
    .filter(([k, v]) => (k === "$ref" && typeof v === "string"))
    .map(([_, v]) => String(v));

  const objects = Object.values(obj)
    .filter((v): v is object => (v && typeof v === "object"));

  return [
    ...new Set([
      ...refs,
      ...objects.map(getRefs).flat(),
    ]),
  ];
};

const getSchemaRefs = (schema: string): string[] => {
  return getRefs(getSchemaObject(schema))
    .filter((ref) =>
      path.extname(ref) === ".yaml" &&
      path.dirname(path.join(schemaDir, ref)) === schemaDir
    )
    .map((ref) => path.basename(ref, ".yaml"));
};

const getSchemaAllRefs = (schema: string): string[] => {
  const refs = getSchemaRefs(schema);
  return [...refs, ...refs.map(getSchemaRefs).flat()];
};

const getIncludeSchemas = (needles: string[], targets: string[]): string[] => {
  const list = targets
    .filter((target) =>
      needles.some((needle) => getSchemaAllRefs(target).includes(needle))
    );

  const list2 = list.length > 0 ? getIncludeSchemas(list, targets) : [];

  return [...new Set([...list, ...list2])];
};

type PathBody = {
  operationId?: string;
  [key: string]: unknown;
};

const getPathData = (target: string) => {
  const targetYaml = yaml.parse(
    Deno.readTextFileSync(path.join(pathDir, `${target}.yaml`)),
  ) as Record<string, PathBody>;

  const endpointPath = [
    "",
    ...target.split("."),
  ].join("/");

  return Object.entries(targetYaml)
    .map(([method, body]) => {
      const schemas = getRefs(body)
        .filter((ref) =>
          path.extname(ref) === ".yaml" &&
          path.dirname(path.join(pathDir, ref)) === schemaDir
        )
        .map((ref) => path.basename(ref, ".yaml"));

      return {
        operationId: body.operationId,
        method: method.toUpperCase(),
        path: endpointPath,
        schemas: [
          ...new Set([
            ...schemas,
            ...schemas.map((schema) => getSchemaAllRefs(schema)).flat(),
          ]),
        ],
      };
    });
};

const command = define({
  name: "search",
  description: "schema がどのエンドポイントで利用されているか確認する。",
  args: {
    schema: {
      type: "string",
      required: true,
      description: "走査する schema 名。",
    },
    changelog: {
      type: "boolean",
      default: false,
      description: "CHANGELOG に貼りつける用の markdown を出力する。",
    },
  },
  run: async (ctx) => {
    const needleSchema = ctx.values.schema;
    const changelog = ctx.values.changelog;

    const haystackSchemas: string[] = [];
    for await (
      const entry of fs.walk(schemaDir, {
        includeFiles: true,
        includeDirs: false,
        followSymlinks: false,
        exts: ["yaml"],
      })
    ) {
      if (entry.isFile) {
        haystackSchemas.push(path.basename(entry.name, ".yaml"));
      }
    }

    const haystackPaths: string[] = [];
    for await (
      const entry of fs.walk(pathDir, {
        includeFiles: true,
        includeDirs: false,
        followSymlinks: false,
        exts: ["yaml"],
      })
    ) {
      if (entry.isFile) {
        haystackPaths.push(path.basename(entry.name, ".yaml"));
      }
    }

    if (!haystackSchemas.includes(needleSchema)) {
      throw new Error(`'${needleSchema}' is not exists.`);
    }

    const includeSchemas = getIncludeSchemas([needleSchema], haystackSchemas);

    const includePathDatas = haystackPaths.map(getPathData).flat().filter(
      (pathData) =>
        pathData.schemas.find((schema) =>
          includeSchemas.includes(schema) || needleSchema === schema
        ),
    );

    console.info("");
    console.info(pc.bold("Schemas:"));
    console.info("");
    includeSchemas
      .sort()
      .forEach((schema) => {
        console.info(`  ${pc.gray("-")} ${pc.green(schema)}`);
      });
    console.info("");
    console.info(pc.bold("Endpoints:"));
    console.info("");
    includePathDatas.map((pathData) => `${pathData.method} ${pathData.path}`)
      .sort()
      .forEach((endpoint) => {
        console.info(`  ${pc.gray("-")} ${pc.cyan(endpoint)}`);
      });
    if (changelog) {
      console.info("");
      console.info(pc.bold("CHANGELOG に貼りつける用:"));
      console.info("");
      includePathDatas.map((pathData) =>
        `[${pathData.method} ${pathData.path}](/operations/${pathData.operationId})`
      ).sort()
        .forEach((endpoint) => {
          console.info(`  ${pc.gray("-")} ${pc.blue(endpoint)}`);
        });
    }
  },
});

await cli(Deno.args, command);
