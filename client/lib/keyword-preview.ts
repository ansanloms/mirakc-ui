/**
 * キーワード自動録画の一致プレビュー・件数表示で使う「今後 7 日間の番組」
 * の組み立て。一致判定そのものは server/lib/keyword-rules.ts の
 * matchesKeywordRule (録画ジョブと同一ロジック) に委ねる。
 */
import type { components } from "./api/schema.d.ts";
import type { KeywordRuleTarget } from "../../server/lib/keyword-rules.ts";
import { serviceOfProgram } from "./service.ts";

type Program = components["schemas"]["MirakurunProgram"];
type Service = components["schemas"]["MirakurunService"];

/** プレビュー対象の窓 (日数)。デザイン仕様の「今後7日間」。 */
export const UPCOMING_WINDOW_DAYS = 7;

export type UpcomingProgram = {
  program: Program;
  service?: Service;

  /** matchesKeywordRule に渡す正規化済みターゲット。 */
  target: KeywordRuleTarget;
};

/**
 * 今後 7 日間に放送される (終了していない) 番組を開始時刻順で返す。
 * 名前の無い番組はキーワード一致し得ないため除外する。
 */
export function buildUpcoming(
  programs: Program[],
  services: Service[],
  nowEpochMs: number,
): UpcomingProgram[] {
  const windowEnd = nowEpochMs + UPCOMING_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return programs
    .filter((program) =>
      Boolean(program.name) &&
      program.startAt + program.duration > nowEpochMs &&
      program.startAt < windowEnd
    )
    .sort((a, b) => a.startAt - b.startAt || a.id - b.id)
    .map((program) => {
      const service = serviceOfProgram(services, program);
      return {
        program,
        service,
        target: {
          name: program.name,
          startAt: program.startAt,
          channelId: service?.channel.channel,
          genres: (program.genres ?? []).map((g) => g.lv1),
        },
      };
    });
}
