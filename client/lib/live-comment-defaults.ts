/**
 * デフォルト割り当ての一括登録プラン。データ (client/assets/datas) と mirakc に
 * 存在する channel から「追加(POST)する分 / 無視(skip)する分」を決める純粋ロジック。
 * IO (実際の add) は route 側が実行する。テスト可能性のため分離する。
 *
 * 既存の設定は見ない。デフォルトは常に「既存とは別の新規エントリ」として追加する
 * (上書きしない)。同一チャンネルが二重に並んでもよく、コメント取得側で uniq する
 * 想定。これにより enable を切り替えて既存 / デフォルトを素早く使い分けられる。
 */
import type { LiveCommentDefaultMapping } from "../assets/datas/live-comment-defaults.ts";
import type { LiveCommentMappingInput } from "./api/live-comment-settings.ts";

export type DefaultApplyPlan = {
  /** 追加登録するチャンネル。 */
  adds: LiveCommentMappingInput[];
  /** mirakc に存在せず対象外にした channel。 */
  skipped: string[];
};

/**
 * デフォルトデータの追加登録プランを組む。
 *
 * - mirakc に存在しない channel (existingChannelIds に無い) は skip する
 *   (例: BS を設定していない環境の BS チャンネル)。
 * - 残りはすべて新規追加 (既存設定とは独立)。enabled は常に true。
 */
export function planDefaultApply(
  defaults: LiveCommentDefaultMapping[],
  existingChannelIds: Set<string>,
): DefaultApplyPlan {
  const adds: LiveCommentMappingInput[] = [];
  const skipped: string[] = [];

  for (const def of defaults) {
    if (!existingChannelIds.has(def.channel)) {
      skipped.push(def.channel);
      continue;
    }
    adds.push({
      channel: def.channel,
      assignments: def.assignments.map((a) => ({ ...a })),
      enabled: true,
    });
  }

  return { adds, skipped };
}
