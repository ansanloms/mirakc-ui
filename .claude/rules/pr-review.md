# Pull Request / Issue の Claude レビュー

`anthropics/claude-code-action` を 2 本の GitHub Actions で運用している。

- `.github/workflows/claude-code-review.yml` — PR が `opened` / `synchronize` / `ready_for_review` / `reopened` の時に**自動**で `/code-review:code-review` を実行する。PR 作成直後に必ず走るので、手動トリガは不要。
- `.github/workflows/claude.yml` — Issue / PR / レビュー / コメントに `@claude` メンションが含まれると起動する対話型。自動レビューとは別に、設計視点の依頼・追加質問・具体の観点を指定したレビューを回したい場合はこちらを使う。

## 手順: PR を作成したら Claude にレビュー依頼する

1. `gh pr create ...` で PR を作成する（この時点で `claude-code-review` が自動起動する）。
2. PR 本体のコメントで `@claude` メンションを含むレビュー依頼を投稿する。観点を箇条書きで指定するとレビューが刺さりやすい。

```
@claude レビューお願い。

特に見てほしい観点:

1. ...
2. ...
```

3. Claude のレビューコメントが付いたら、必要に応じて追加コメントで `@claude` メンションして質問・修正依頼する。
4. レビュー結果をもとにコミット → push すれば、`claude-code-review.yml` が `synchronize` で再実行される。

## Issue でも同様に

Issue のタイトルや本文に `@claude` を含めると `claude.yml` が起動する。複雑な仕様調査や設計相談を Issue ベースで回したい場合に有用。

## 観点を示すコツ

- 「UI の妥当性」より「`islands/Watch.tsx:33-44` の初期化ロジックが render 中 setState になっていないか」のように**ファイル+行+具体観点**を書く
- 優先度表 (要修正 / 推奨 / 任意 / 参考) を期待するとレビュー側もその粒度で返してくる
- 返ってきた指摘の **スコープ外**判断は別 issue に切り出して明示すると整理される
