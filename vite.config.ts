import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import path from "node:path";
import fs from "node:fs";

export default defineConfig({
  base: "./",
  build: {
    manifest: true,
    cssCodeSplit: true,
  },
  plugins: [
    fresh(),
    {
      // 一部の *.module.css が読み込まれないので強制的に読み込み。
      // 既に読み込まれる CSS も重複して読み込まれるけど動くの優先で。
      name: "force-inject-all-css",
      apply: "build",
      writeBundle(options, bundle) {
        const outputDir = options.dir || "dist";
        const manifestPath = path.resolve(outputDir, ".vite/manifest.json");

        if (!fs.existsSync(manifestPath)) {
          console.warn("[force-inject] Manifest not found");
          return;
        }

        const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

        // 1. 生成されたすべてのCSSファイル名を取得
        const allCssFiles = Object.values(bundle)
          .filter((f) => f.type === "asset" && f.fileName.endsWith(".css"))
          .map((f) => f.fileName);

        if (allCssFiles.length === 0) {
          console.log("[force-inject] No CSS files found in bundle.");
          return;
        }

        console.log("[force-inject] Found CSS files:", allCssFiles);

        // 2. マニフェスト内のすべてのIsland（またはエントリポイント）に対して注入
        Object.keys(manifest).forEach((key) => {
          const entry = manifest[key];

          // islands フォルダ内のもの、または isEntry なものすべてを対象にする
          if (key.includes("islands/") || entry.isEntry) {
            entry.css = entry.css || [];

            allCssFiles.forEach((cssFile) => {
              if (!entry.css.includes(cssFile)) {
                entry.css.push(cssFile);
              }
            });
            console.log(`✅ Injected all CSS into: ${key}`);
          }
        });

        // 3. マニフェストを上書き
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      },
    },
  ],
});
