/**
 * デフォルト割り当ての一括登録プラン。データ (client/assets/datas) と現在の
 * 状態から「追加(POST) / 上書き(PUT) / 無視(skip)」を決める純粋ロジック。
 * IO (実際の add/update) は route 側が実行する。テスト可能性のため分離する。
 */
import type { LiveCommentDefaultMapping } from "../assets/datas/live-comment-defaults.ts";
import type {
  LiveCommentMapping,
  LiveCommentMappingInput,
} from "./api/live-comment-settings.ts";

export type DefaultApplyPlan = {
  /** 新規登録するチャンネル(現在未登録)。 */
  adds: LiveCommentMappingInput[];
  /** 上書きするチャンネル(現在登録済み)。割り当てをデータで置き換える。 */
  updates: { id: string; input: LiveCommentMappingInput }[];
  /** mirakc に存在せず対象外にした channel。 */
  skipped: string[];
};

/**
 * デフォルトデータの適用プランを組む。
 *
 * - mirakc に存在しない channel (existingChannelIds に無い) は skip する
 *   (例: BS を設定していない環境の BS チャンネル)。
 * - 既に登録済みの channel は上書き (update)、未登録は新規 (add)。
 * - enabled は常に true (デフォルト登録は有効状態で入れる)。
 */
export function planDefaultApply(
  defaults: LiveCommentDefaultMapping[],
  existingChannelIds: Set<string>,
  current: LiveCommentMapping[],
): DefaultApplyPlan {
  const byChannel = new Map(current.map((m) => [m.channel, m]));
  const adds: LiveCommentMappingInput[] = [];
  const updates: { id: string; input: LiveCommentMappingInput }[] = [];
  const skipped: string[] = [];

  for (const def of defaults) {
    if (!existingChannelIds.has(def.channel)) {
      skipped.push(def.channel);
      continue;
    }
    const input: LiveCommentMappingInput = {
      channel: def.channel,
      assignments: def.assignments.map((a) => ({ ...a })),
      enabled: true,
    };
    const found = byChannel.get(def.channel);
    if (found !== undefined) {
      updates.push({ id: found.id, input });
    } else {
      adds.push(input);
    }
  }

  return { adds, updates, skipped };
}
