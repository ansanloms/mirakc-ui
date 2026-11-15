# PR 作成前の検証

- MUST: PR を作成する前に、次の検証チェーンを順に実行し、すべて成功させること。

```sh
npm run fix && npm run check && npm run lint && npm run test && npm run build
```

- 個別コマンドをその場で手組みせず、この並びをそのまま使う。
- 失敗した場合は修正のうえ、チェーンを先頭から再実行する。
- PR を伴わない push でも、push 前に同じチェーンを実行する。
