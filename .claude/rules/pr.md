# PR 作成前の検証

- MUST: PR を作成する前に、次の検証チェーンを順に実行し、すべて成功させること。

```sh
npm run build && npm run fix && npm run check && npm run lint && npm run test
```

- `build` を先頭に置くのは、`check`（型検査）が生成物 `client/routeTree.gen.ts`（gitignore 対象）を要し、`build` がそれを生成するため。CI（`.github/workflows/check.yml`）も `build` を `check` より先に実行する。
- 個別コマンドをその場で手組みせず、この並びをそのまま使う。
- 失敗した場合は修正のうえ、チェーンを先頭から再実行する。
- PR を伴わない push でも、push 前に同じチェーンを実行する。
