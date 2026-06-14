import * as path from "@std/path";

const ASSETS = [
  "web-components.min.js",
  "web-components.min.js.LICENSE.txt",
  "styles.min.css",
];

const __dirname = path.dirname(path.fromFileUrl(import.meta.url));
const INDEX_HTML_PATH = path.join(__dirname, "./../index.html");

const entryUrl = import.meta.resolve(
  "@stoplight/elements/web-components.min.js",
);
const baseDir = path.dirname(path.fromFileUrl(entryUrl));

const to = Deno.args[0] ?? "./dist";
await Deno.mkdir(to, { recursive: true });

for (const asset of ASSETS) {
  const src = path.join(baseDir, asset);
  const dest = path.join(to, asset);
  await Deno.copyFile(src, dest);
  console.log(`copied: ${asset} -> ${dest}`);
}

const indexHtml = await Deno.readTextFile(INDEX_HTML_PATH);
const rewritten = indexHtml
  .replaceAll(
    /https:\/\/unpkg\.com\/@stoplight\/elements(?:@[^/]+)?\/web-components\.min\.js/g,
    "./web-components.min.js",
  )
  .replaceAll(
    /https:\/\/unpkg\.com\/@stoplight\/elements(?:@[^/]+)?\/styles\.min\.css/g,
    "./styles.min.css",
  );
const indexDest = path.join(to, "index.html");
await Deno.writeTextFile(indexDest, rewritten);
console.log(`written: index.html -> ${indexDest}`);
