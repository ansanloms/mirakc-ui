-- 実況コメント設定の初期データ (関東)。
--
-- 設定 DB が空のとき (kv テーブルがまだ無いとき) の起動に限り、init ディレクトリ
-- (既定は server/initdb.d、環境変数 DATA_INIT_DIR で変更可) の *.sql が名前順に
-- 実行される。kv テーブルが既にある DB には実行されない。
--
-- 実行条件: init SQL は kv テーブルを作成した後に、1 つのトランザクションの中で
-- 実行される。そのため BEGIN・COMMIT・ROLLBACK は書けず、kv テーブルを作る文も
-- 要らない。1 つでも失敗すると全体が取り消され、起動が止まる。
--
-- channel は MirakurunChannel.channel (地上波は物理 ch 番号、BS は
-- BS<TP>_<slot>) で、地域・チューナ構成に依存する。物理 ch 番号は地域ごとに
-- 別の局へ割り当てられるので、関東以外でこのまま使うと別の局に実況が付く。
-- 他の地域では、初回起動の前にこのディレクトリを、地域に合わせた SQL を置いた
-- ディレクトリに差し替える。mirakc に存在しない channel の行は、視聴時に使われ
-- ないだけで害はない。
--
-- 値の出典:
-- - 物理 ch 24..27 / BS15_0 ... 本リポジトリの client/lib/fixtures.ts
-- - 物理 ch 16 / 21..23 ... 東京スカイツリーの地上デジタル割当 (関東広域)
-- - nx-jikkyo (jk 番号) ... ニコニコ実況 / NX-Jikkyo の実況チャンネル番号
-- - nicolive (ch 番号) ... 本家ニコニコ実況のニコニコチャンネル ID
--   (旧 server/lib/comments/jikkyo.ts の NICOLIVE_CHANNEL_ID_OF より)
--
-- 並び順: ord は、API (store.list()) が返す順 (createdAt の降順) を下の記述順に
-- 固定するためのもの。ord が小さい行ほど createdAt を大きくする。設定画面は
-- channel 順に並べる。

WITH d(ord, id, channel, nicolive, nx_jikkyo) AS (VALUES
  (0, '58333208-50a4-4e76-be6f-b9439c756842', '27', 'ch2646436', 'jk1'), -- NHK総合
  (1, '7bdc02fa-9913-4756-8d2b-b1be6f854cf1', '26', 'ch2646437', 'jk2'), -- NHK Eテレ
  (2, '39df1dcb-9764-466c-bb9d-82522dd06f95', '25', 'ch2646438', 'jk4'), -- 日本テレビ
  (3, 'cb9882f7-b533-49b3-a6b9-0eca4daba192', '24', 'ch2646439', 'jk5'), -- テレビ朝日
  (4, '3ba6d8ad-7a2f-4dea-8f69-eddc06c060c9', '22', 'ch2646440', 'jk6'), -- TBS
  (5, '20d4a918-d1b1-4b02-92ee-a22ae24d4691', '23', 'ch2646441', 'jk7'), -- テレビ東京
  (6, '5d6a8948-2ed9-4261-9f19-aabc2c6f17e5', '21', 'ch2646442', 'jk8'), -- フジテレビ
  (7, 'd1be239e-9b30-42a2-94ed-5bedd2108e96', '16', 'ch2646485', 'jk9'), -- TOKYO MX
  (8, 'b87371ea-2a1d-4bdb-add9-af986f7581d8', 'BS15_0', 'ch2647992', 'jk101') -- NHK BS
)
INSERT INTO kv (key, value)
SELECT
  json_array('settings', 'live-comment', id),
  json_object(
    'id', id,
    'channel', channel,
    'assignments', json_array(
      json_object('source', 'nicolive', 'channelId', nicolive),
      json_object('source', 'nx-jikkyo', 'channelId', nx_jikkyo)
    ),
    'enabled', json('true'),
    'createdAt', CAST(unixepoch('subsec') * 1000 AS INTEGER) - ord
  )
FROM d;
