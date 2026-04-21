# Deno 設定の注意点

- `nodeModulesDir: "manual"` — npm 互換性モード
- `jsx: "precompile"` / `jsxImportSource: "preact"`
- `hooks/api/schema.d.ts` と `_fresh/` は lint/fmt の除外対象
- Deno のバージョンは Dockerfile の `FROM docker.io/denoland/deno:<version>` と `.devcontainer/onCreateCommand.sh` の `v<version>` 指定を揃える。上げる際は両方同時に更新する
