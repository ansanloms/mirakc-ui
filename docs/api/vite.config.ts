import { execFile } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import * as path from "node:path";
import { promisify } from "node:util";
import { defineConfig, normalizePath, type Plugin } from "vite";

const repoRoot = import.meta.dirname;
// dev サーバは root 配下を静的に配信する。リポジトリのファイルを露出させないため、中身が空の専用ディレクトリを root にし、
// server.fs.allow も root だけに絞る (既定ではリポジトリ全体が許可され、/@fs/ や root 外への相対パスで読めてしまう)。
const serverRoot = path.join(repoRoot, ".cache", "vite");
mkdirSync(serverRoot, { recursive: true });

const run = promisify(execFile);

// 変更を検知する対象。HTML の生成元になるファイルとディレクトリ。
const watchTargets = [
  "api.yaml",
  "redocly.yaml",
  "README.md",
  "paths",
  "components",
  "examples",
].map((name) => normalizePath(path.join(repoRoot, name)));

const isWatched = (file: string): boolean => {
  const normalized = normalizePath(file);
  return watchTargets.some(
    (target) => normalized === target || normalized.startsWith(`${target}/`),
  );
};

// redocly の実行ファイルは、固定した版の package.json の bin から解決する。
const redoclyBin = (): string => {
  const pkgPath = path.join(repoRoot, "node_modules", "@redocly", "cli", "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { bin: string | Record<string, string> };
  const bin = typeof pkg.bin === "string" ? pkg.bin : pkg.bin.redocly;
  return path.join(path.dirname(pkgPath), bin);
};

const escapeHtml = (text: string): string =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

// Vite の HMR client を載せる。transformIndexHtml は数 MB のインライン script を書き換えて遅いため使わない。
const clientScript = '<script type="module" src="/@vite/client"></script>';

const withClient = (html: string): string => {
  const match = /<head(\s[^>]*)?>/i.exec(html);
  if (!match) {
    return clientScript + html;
  }
  const end = match.index + match[0].length;
  return html.slice(0, end) + clientScript + html.slice(end);
};

// dev 専用。redocly build-docs で spec を HTML にして返し、spec のファイルが変わったら作り直して full reload を送る。
function redoc(): Plugin {
  let outDir = "";
  let html: string | null = null;
  let error: string | null = null;
  let running: Promise<void> | null = null;
  let again = false;

  const build = async (): Promise<void> => {
    const output = path.join(outDir, "index.html");
    try {
      await run(
        process.execPath,
        [
          redoclyBin(),
          "build-docs",
          path.join(repoRoot, "api.yaml"),
          "--config",
          path.join(repoRoot, "redocly.yaml"),
          "--inlineBundle",
          "--output",
          output,
        ],
        { cwd: repoRoot, maxBuffer: 64 * 1024 * 1024 },
      );
      html = readFileSync(output, "utf8");
      error = null;
    } catch (e) {
      const err = e as { stderr?: string; stdout?: string; message?: string };
      html = null;
      error = [err.stderr, err.stdout, err.message].filter(Boolean).join("\n");
      console.error(error);
    }
  };

  // 同時に走らせるのは 1 つだけ。実行中に変更が来たら、終わった後にもう 1 回だけ走らせる。
  const generate = (): Promise<void> => {
    if (running) {
      again = true;
      return running;
    }
    running = (async () => {
      do {
        again = false;
        await build();
      } while (again);
    })().finally(() => {
      running = null;
    });
    return running;
  };

  return {
    name: "redoc",
    configureServer(server) {
      outDir = path.join(repoRoot, ".cache", "redoc");
      mkdirSync(outDir, { recursive: true });
      server.watcher.add(watchTargets);
      void generate();

      server.middlewares.use(async (req, res, next) => {
        if (req.method !== "GET" || (req.url !== "/" && req.url !== "/index.html")) {
          return next();
        }
        await running;
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        if (html !== null) {
          res.end(withClient(html));
          return;
        }
        res.statusCode = 500;
        res.end(
          withClient(
            `<!doctype html><html><head><meta charset="utf-8"><title>build-docs failed</title></head><body><pre>${escapeHtml(error ?? "build-docs failed")}</pre></body></html>`,
          ),
        );
      });
    },
    async hotUpdate({ file }) {
      if (this.environment.name !== "client" || !isWatched(file)) {
        return;
      }
      await generate();
      this.environment.hot.send({ type: "full-reload" });
      return [];
    },
  };
}

export default defineConfig({
  root: serverRoot,
  // hash router 相当の SPA fallback は不要。存在しないパスを index.html にせず 404 にする。
  appType: "mpa",
  publicDir: false,
  // 自前の HTML を返すだけで、依存の事前 bundle は要らない。entry が無い旨の警告は出ても動作に影響しない。
  optimizeDeps: { noDiscovery: true },
  plugins: [redoc()],
  server: { host: true, port: 4000, fs: { allow: [serverRoot] } },
  build: {
    // vite preview が配信する場所。dist/ は build:bundle と build:docs が作る。
    outDir: path.join(repoRoot, "dist"),
  },
});
