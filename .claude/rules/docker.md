# Docker (本番)

`Dockerfile` はマルチステージビルドで、linux/amd64 と linux/arm64 に対応する。GitHub Release の公開で GHCR に publish する（`.github/workflows/publish-docker.yml`）。

## タイムゾーン

最終ステージは `TZ` をハードコードしない（中立。地域に依存させない方針）。Node イメージの既定はシステム TZ で、コンテナでは UTC になる。`TZ` 未設定だと録画通知・録画ファイル名が UTC で出る（`server/main.ts` が `Temporal.Now.timeZoneId()` で解決して整形に注入する）。UI の日時表示はブラウザのローカル TZ に従うため `TZ` の影響を受けない。

本番コンテナでは `TZ` を環境変数として渡す（compose の `environment:` か `docker run -e TZ=Asia/Tokyo ...`）。`Asia/Tokyo` 等の解決に追加の `tzdata` インストールは要らない。既定が UTC になることと合わせて、`node:26-bookworm-slim` で 2026-11-15 に実測した。

## PID 1 と終了処理

最終ステージは `tini` を PID 1 にして `node server/main.ts` を起動する。理由: Node を PID 1 で直接動かすと、シグナルの受け取りと子プロセスの回収を Node が担うことになるため。`server/main.ts` は `SIGTERM`/`SIGINT` で接続と KV を閉じて終了する。

## `$BUILDPLATFORM` の使い分け

`mirakc-ui-build` ステージは `--platform=$BUILDPLATFORM` にしている。Buildx が実行ホストのネイティブ platform を割り当てるため、次の 2 つが両立する。

- CI (amd64 runner): `$BUILDPLATFORM` は `linux/amd64` に解決される → QEMU を介さずにビルド
- Raspberry Pi (arm64 ホスト): `$BUILDPLATFORM` は `linux/arm64` に解決される → ネイティブビルド

過去に `--platform=linux/amd64` 固定にしていた時期があるが、QEMU エミュレーションで Vite ビルドが `EISDIR` になる問題の回避が目的だった（[fe770ad](https://github.com/ansanloms/mirakc-ui/commit/fe770ad), [c5ee238](https://github.com/ansanloms/mirakc-ui/commit/c5ee238)）。現在は `$BUILDPLATFORM` 化で両対応（[#14](https://github.com/ansanloms/mirakc-ui/pull/14)）。

## トランスコード層の設計方針

Dockerfile は mirakc-ui 内部で ffmpeg/tsreadex を実行する前提で tsreadex/ffmpeg を同梱する。トランスコード層を外部コンテナに分離する案は image/publish 系統が二重化するコストが過大なため見送り、1 イメージで watch まで完結する内蔵構成で確定した（[#16](https://github.com/ansanloms/mirakc-ui/issues/16)）。

## ハードウェアエンコード

ライブ視聴のエンコーダは `server/lib/encoder.ts` が実 probe で選ぶ（`h264_vaapi` → `h264_v4l2m2m` → `libx264`）。環境変数 `VIDEO_ENCODER` で 1 つに固定でき、固定したエンコーダが使えないときは他へ落とさず 503 を返す。

- VAAPI の処理範囲: デコード・`yadif`・`scale` は CPU のまま、末尾の `format=nv12,hwupload` でエンコードだけを GPU に渡す。エンコーダに渡る時点でプログレッシブなので、Mesa の「エンコードとインターレースが両立しない」問題を踏まない。`-bf 0` は `h264_vaapi` の既定が `bf=2` で、低遅延用途では B フレームを切る必要があるため。
- デバイスパス: コンテナ内は `/dev/dri/renderD128` に固定する。環境変数でパスを受けない。ホストに GPU が複数ある場合は `--device <ホスト側パス>:/dev/dri/renderD128` で対応付ける。render node の番号が入れ替わる環境では、ホスト側を `/dev/dri/by-path/...` で指す。
- ドライバ: 最終ステージに `mesa-va-drivers` を同梱する。`--no-install-recommends ffmpeg` で入るのは `libva2` までで、ドライバは入らないため。Debian bookworm の Mesa 22.3.6 が AMD Radeon 760M で H.264 の `VAEntrypointEncSlice` を通すことを実機で確認した。イメージの増分は amd64 で約 17MB (2026-11-16 実測)。`libllvm15` は ffmpeg の依存で元から入っているため、増分は小さい。同梱するのは Mesa (AMD) のドライバだけで、Intel GPU 用のドライバは入れていない (未対応)。増分が小さいので、アーキテクチャで分けず全イメージに入れる。
- 既存環境への影響: デバイスが無い、またはドライバが対応しない環境では `h264_vaapi` の probe が失敗し、従来どおり `h264_v4l2m2m` → `libx264` に落ちる。
- 未対応: NVENC（`h264_nvenc`）。実機で検証できるようになってから別途扱う。
