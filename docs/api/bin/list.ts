import { cli, define } from "@gunshi/gunshi";
import Table from "cli-table3";
import * as fs from "@std/fs";
import * as path from "@std/path";
import * as yaml from "yaml";

const __dirname = path.dirname(path.fromFileUrl(import.meta.url));

const methodOrder = [
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "HEAD",
  "OPTIONS",
  "PATCH",
  "TRACE",
  "CONNECT",
] as const;

type Method = typeof methodOrder[number];

const getEndpointPath = (filePath: string) => {
  return (
    "/" +
    path
      .basename(filePath, ".yaml")
      .split(".")
      .map((v) => v.replaceAll("{", "[").replaceAll("}", "]"))
      .join("/")
  );
};

const command = define({
  name: "endpoints",
  description: "エンドポイント一覧を出力する。",
  args: {
    format: {
      type: "string",
      default: "table",
      description: "出力形式 (table | json)。",
    },
  },
  run: async (ctx) => {
    const { format } = ctx.values;
    if (format !== "table" && format !== "json") {
      throw new Error(`unknown format: ${format}`);
    }

    const pathFiles: string[] = [];
    for await (
      const entry of fs.walk(path.resolve(path.join(__dirname, "../paths")), {
        includeFiles: true,
        includeDirs: false,
        followSymlinks: false,
        exts: ["yaml"],
      })
    ) {
      pathFiles.push(entry.path);
    }

    const endpoints = (await Promise.all(pathFiles.map(async (filePath) => {
      const endpoint = getEndpointPath(filePath);
      const parsed = yaml.parse(
        await Deno.readTextFile(filePath),
      ) as Record<string, { summary?: unknown }>;

      return Object.entries(parsed).map(([method, body]) => ({
        method: method.toUpperCase(),
        endpoint,
        summary: String(body?.summary ?? ""),
      }));
    }))).flat().toSorted((a, b) => {
      if (a.endpoint !== b.endpoint) {
        return a.endpoint.localeCompare(b.endpoint);
      }
      if (a.method !== b.method) {
        return (
          methodOrder.indexOf(a.method as Method) -
          methodOrder.indexOf(b.method as Method)
        );
      }
      return 0;
    });

    if (format === "table") {
      const table = new Table();
      for (const { method, endpoint, summary } of endpoints) {
        table.push([method, endpoint, summary]);
      }
      console.info(table.toString());
    } else {
      console.info(JSON.stringify(endpoints, undefined, "  "));
    }
  },
});

await cli(Deno.args, command);
