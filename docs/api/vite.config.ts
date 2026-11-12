import { readFileSync, realpathSync, statSync } from "node:fs";
import * as path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, normalizePath, type Plugin } from "vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import { parse } from "yaml";

const specRoot = import.meta.dirname;
const specEntry = "api.yaml";
const specContentTypes: Record<string, string> = {
  ".yaml": "application/yaml",
  ".yml": "application/yaml",
  ".json": "application/json",
  ".md": "text/markdown; charset=utf-8",
};

// spec まわりの処理をまとめる。
// - <title> を、リポジトリ直下の api.yaml の info.title から入れる。
// - dev は bundle せず、api.yaml と参照先のファイルをそのまま配る。Elements が相対 $ref を自分で辿るため。
//   配信の対象は spec のファイルに絞る。ソースや設定、依存を dev サーバ経由で返さないため。
//   リポジトリ直下は spec のエントリ (api.yaml) と Markdown だけを返し、package.json 等の設定ファイルは返さない。
//   (server.host: true で LAN からも取れるため。)
// - 配信したファイル (= ブラウザが取りに来た $ref の参照先) だけを監視し、変更されたら full-reload を送る。
function spec(): Plugin {
  const served = new Set<string>();
  const realRoot = realpathSync(specRoot);
  let serving = false;

  return {
    name: "spec",
    transformIndexHtml() {
      let title: unknown;
      try {
        title = parse(readFileSync(path.join(specRoot, specEntry), "utf8")).info.title;
      } catch (error) {
        // build では握りつぶさず、そのまま投げる (<title> の無い index.html を成功として出さないため)。
        if (!serving) {
          throw error;
        }
        // dev で api.yaml を編集途中の壊れた状態で保存すると、ここで index.html が 500 になりページごと落ちる。
        // 読めないときは <title> を入れずに返し、spec のエラーは Elements の表示と build:bundle の redocly に任せる。
        return [];
      }
      if (title === null || title === undefined) {
        return [];
      }
      // Vite は tag の children を escape しない (escape するのは attrs だけ) ため、ここで行う。
      const escaped = String(title)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;");
      return [{ tag: "title", children: escaped, injectTo: "head-prepend" }];
    },
    configureServer(server) {
      // configureServer は build では呼ばれない。dev かどうかの判定に使う。
      serving = true;
      server.middlewares.use((req, res, next) => {
        let pathname: string;
        try {
          pathname = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
        } catch {
          return next();
        }

        const contentType = specContentTypes[path.extname(pathname).toLowerCase()];
        if (!contentType) {
          return next();
        }

        const file = path.resolve(specRoot, `.${pathname}`);
        const relative = path.relative(specRoot, file);
        if (
          relative === ".." ||
          relative.startsWith(`..${path.sep}`) ||
          path.isAbsolute(relative)
        ) {
          return next();
        }

        const parts = relative.split(path.sep);
        if (
          (parts.length === 1 &&
            parts[0] !== specEntry &&
            path.extname(parts[0]).toLowerCase() !== ".md") ||
          parts.some((part) => part === "node_modules" || part.startsWith(".")) ||
          parts[0] === "src" ||
          parts[0] === "dist"
        ) {
          return next();
        }

        // 文字列の判定だけでは、リポジトリ内のシンボリックリンクが外を指す場合を防げない。実体のパスでも確かめる。
        // 存在しない・NUL を含む・権限が無い等の例外は、すべて spec として返さず next() に流す。
        let real: string;
        try {
          real = realpathSync(file);
          const realRelative = path.relative(realRoot, real);
          if (
            realRelative === ".." ||
            realRelative.startsWith(`..${path.sep}`) ||
            path.isAbsolute(realRelative) ||
            !statSync(real).isFile()
          ) {
            return next();
          }
        } catch {
          return next();
        }

        // Vite の watcher が通知するパスと揃えるため、リンクを辿る前のパスを記録する。
        served.add(normalizePath(file));
        server.watcher.add(file);
        res.setHeader("Content-Type", contentType);
        res.setHeader("Cache-Control", "no-store");
        res.end(readFileSync(real));
      });
    },
    hotUpdate({ file }) {
      if (!served.has(normalizePath(file))) {
        return;
      }
      if (this.environment.name !== "client") {
        return;
      }
      this.environment.hot.send({ type: "full-reload" });
      return [];
    },
  };
}

export default defineConfig({
  // index.html を src/ に置く。
  root: "src",
  // サブパス配下 (GitHub Pages のプロジェクトサイト) でも assets を解決できるよう、相対パスで参照する。
  base: "./",
  // hash router で SPA fallback が不要なため。存在しないパスを index.html にせず 404 にする。
  appType: "mpa",
  // Elements の依存が Node のグローバル (global 等) を前提にしており、無いと実行時に `global is not defined` で落ちるため。
  plugins: [react(), nodePolyfills(), spec()],
  server: { host: true, port: 4000 },
  build: {
    // root (src/) の外へ出力する。root の外は既定では空にされないため emptyOutDir を明示する。
    outDir: "../dist",
    emptyOutDir: true,
    // minify で第三者ライセンス表記が落ちるため、bundle した依存のライセンスを dist/licenses.md に出力する。
    // LICENSE ファイルを同梱しない依存は、名前・版・識別子の見出しだけになる。
    license: { fileName: "licenses.md" },
    rolldownOptions: {
      output: { postBanner: "/* Licenses of bundled dependencies: ../licenses.md */" },
    },
  },
});
