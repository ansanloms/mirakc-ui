/**
 * 実況コメントの正規化型とコメントソースのインターフェイス。
 *
 * コメントの取得元 (ニコニコ実況 / NX-Jikkyo 等) はプラッガブルで、各ソースは
 * `CommentSource` を実装して `server/routes/comments.ts` の SSE 中継に束ねられる。
 * client はここで定義する `SourceComment` を SSE 経由で受け取る (純粋共有モジュール。
 * Deno API 依存を持たせないこと)。
 */

/** コメントソースの識別子。ソースを追加したらここに足す。 */
export type CommentSourceId = "nicolive" | "nx-jikkyo";

/** ソース非依存に正規化した実況コメント 1 件 (SSE で client へ流す形)。 */
export type SourceComment = {
  /** ソース内で一意なコメント ID。 */
  id: string;
  /** 取得元ソース。 */
  source: CommentSourceId;
  /** 投稿時刻 (epoch ミリ秒)。 */
  at: number;
  /** 本文。 */
  text: string;
  /** 投稿者名。匿名コメントでは undefined。 */
  author?: string;
};

/** コメント取得対象のチャンネル (mirakc のサービス情報から組み立てる)。 */
export type CommentTarget = {
  /** mirakc (Mirakurun) の複合サービス ID。設定 (チャンネル割り当て) のキー。 */
  id: number;
  networkId: number;
  serviceId: number;
  /** サービス名 (ハッシュタグ解決等、補助的な用途)。 */
  serviceName?: string;
};

export type CommentSubscribeOptions = {
  /** 購読の打ち切り。abort されたらソースは速やかに後始末して終了する。 */
  signal: AbortSignal;
};

/**
 * コメントソースの実装インターフェイス。
 *
 * `subscribe` は対象チャンネルをこのソースで実況できる場合にコメントの
 * 非同期列を返し、対応していなければ null を返す (設定の参照が要る場合は
 * Promise でもよい)。列は signal が abort されるまで継続し、エラー時の
 * 再接続はソース実装側の責務とする。コメント投稿は現状スコープ外
 * (必要になったらオプショナルで追加する)。
 */
export type CommentSource = {
  readonly id: CommentSourceId;
  subscribe(
    target: CommentTarget,
    options: CommentSubscribeOptions,
  ):
    | AsyncIterable<SourceComment>
    | null
    | Promise<AsyncIterable<SourceComment> | null>;
};
