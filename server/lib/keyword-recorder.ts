/**
 * キーワード自動録画ジョブ。
 *
 * mirakc の番組一覧からルール (キーワード・期間・チャンネル・ジャンル) に
 * 一致する将来の番組を探し、録画予約 (`POST /recording/schedules`) を登録して
 * 通知する。一致判定は server/lib/keyword-rules.ts の `matchesKeywordRule`
 * (client のプレビューと同一ロジック)。
 *
 * Deno.cron 相当の定期実行は `startKeywordRecordingJob` (起動時 + setInterval)
 * で行う。`Deno.cron` は使わない (--unstable-cron が必要な上、ポーリング型の
 * 本ジョブに利点が無い)。
 */

import { type KeywordRule, matchesKeywordRule } from "./keyword-rules.ts";
import type { NtfyNotification } from "./ntfy.ts";
import {
  formatDisplayDateTime,
  formatDisplayTime,
  formatYmdHms,
} from "./datetime.ts";
import { t } from "../locales/i18n.ts";

/** このジョブが登録した予約に付ける識別タグ。 */
export const KEYWORD_RECORDING_TAG = "mirakc-ui:keyword";

/** マッチングに使う番組情報 (MirakurunProgram のサブセット)。 */
export type ProgramLike = {
  id: number;
  name?: string | null;
  description?: string | null;
  startAt: number;
  duration: number;
  networkId: number;
  serviceId: number;
  genres?: { lv1: number }[] | null;
};

/** service id 解決・チャンネル名表示に使うサービス情報のサブセット。 */
type ServiceLike = {
  id: number;
  networkId: number;
  serviceId: number;
  name: string;
};

export type KeywordRecorderDeps = {
  /** mirakc の Web API のベース URL (mirakcApiUrlOf で構築)。 */
  mirakcApiUrl: string;

  /** ルール一覧を返す。enabled の絞り込みはジョブ側で行う。 */
  listRules: () => Promise<KeywordRule[]>;

  /** 通知の送信。失敗しても throw しないこと (ntfy.ts の sendNtfy 準拠)。 */
  notify: (notification: NtfyNotification) => Promise<unknown>;

  fetchFn?: typeof fetch;

  /** 現在時刻 (epoch ms)。テストで固定できるよう注入可能。 */
  now?: number;

  /** ファイル名・通知文面・期間判定の整形に使うタイムゾーン。 */
  timeZone?: string;
};

/**
 * 録画ファイルの保存パス。手動予約 (client/routes/program/.../$programId.tsx)
 * と同じ `{開始日時}_{番組ID}_{番組名}.m2ts` 形式に揃える。
 */
export function buildContentPath(
  program: ProgramLike,
  timeZone?: string,
): string {
  return `${formatYmdHms(program.startAt, timeZone)}_${program.id}_${
    program.name ?? ""
  }.m2ts`;
}

type ScheduleLike = { program: { id: number } };

async function fetchJson<T>(
  fetchFn: typeof fetch,
  url: string,
): Promise<T> {
  const res = await fetchFn(url);
  if (!res.ok) {
    await res.body?.cancel();
    throw new Error(`GET ${url} failed: ${res.status}`);
  }
  return await res.json() as T;
}

/**
 * キーワード録画を 1 回実行する。有効ルールに一致した未予約・将来の番組を
 * 予約し、1 件ごとに通知する。個別の予約失敗はログに残して続行する。
 */
export async function runKeywordRecording(
  deps: KeywordRecorderDeps,
): Promise<{ registered: { programId: number; keyword: string }[] }> {
  const rules = (await deps.listRules()).filter((rule) => rule.enabled);
  if (rules.length === 0) {
    return { registered: [] };
  }

  const fetchFn = deps.fetchFn ?? fetch;
  const now = deps.now ?? Date.now();
  const apiUrl = deps.mirakcApiUrl.replace(/\/$/, "");

  const [programs, services, schedules] = await Promise.all([
    fetchJson<ProgramLike[]>(fetchFn, `${apiUrl}/programs`),
    fetchJson<ServiceLike[]>(fetchFn, `${apiUrl}/services`),
    fetchJson<ScheduleLike[]>(fetchFn, `${apiUrl}/recording/schedules`),
  ]);
  const scheduledIds = new Set(schedules.map((s) => s.program.id));
  // (networkId, serviceId) → サービス (Mirakurun の複合 id とチャンネル名)。
  const serviceOf = new Map(
    services.map((s) => [`${s.networkId}:${s.serviceId}`, s]),
  );

  const registered: { programId: number; keyword: string }[] = [];
  for (const program of programs) {
    if (program.startAt <= now || scheduledIds.has(program.id)) {
      continue;
    }
    const service = serviceOf.get(`${program.networkId}:${program.serviceId}`);
    const target = {
      name: program.name,
      startAt: program.startAt,
      serviceId: service?.id,
      genres: (program.genres ?? []).map((g) => g.lv1),
    };
    const rule = rules.find((r) =>
      matchesKeywordRule(r, target, deps.timeZone)
    );
    if (!rule) {
      continue;
    }

    const res = await fetchFn(`${apiUrl}/recording/schedules`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        programId: program.id,
        options: { contentPath: buildContentPath(program, deps.timeZone) },
        tags: [KEYWORD_RECORDING_TAG, `keyword:${rule.keyword}`],
      }),
    });
    await res.body?.cancel();
    if (!res.ok) {
      console.error(
        `[keyword-recorder] failed to schedule program ${program.id}: ${res.status}`,
      );
      continue;
    }

    scheduledIds.add(program.id);
    registered.push({ programId: program.id, keyword: rule.keyword });

    const message = [
      t("notification.keyword.message", { keyword: rule.keyword }),
      service?.name ?? null,
      t("notification.recording.airtime", {
        start: formatDisplayDateTime(program.startAt, deps.timeZone),
        end: formatDisplayTime(
          program.startAt + program.duration,
          deps.timeZone,
        ),
      }),
    ].filter((line): line is string => line !== null).join("\n");
    await deps.notify({
      title: t("notification.keyword.title", {
        name: program.name ?? program.id,
      }),
      message,
      tags: ["calendar"],
    });
  }

  return { registered };
}

export type KeywordRecordingJob = {
  /**
   * 実行を要求する (EPG 更新イベント等から呼ぶ)。debounceMs の間に届いた
   * 要求は 1 回の実行に畳まれる。実行中に届いた場合は完了後に 1 回だけ走る。
   */
  trigger: () => void;

  /** ジョブを停止する。 */
  stop: () => void;
};

export type KeywordRecordingJobOptions = {
  /** フォールバックの定期実行間隔 (ms)。 */
  intervalMs: number;

  /** trigger の debounce (ms)。EPG 更新のバーストを 1 回に畳む。既定 60 秒。 */
  debounceMs?: number;
};

/**
 * キーワード録画ジョブを起動する。起動時に 1 回 + フォールバックの定期実行
 * (Deno.cron 相当) に加え、trigger (mirakc の epg.programs-updated 等) で
 * 都度実行できる。実行中の例外はログに残して次回へ続行する。
 */
export function startKeywordRecordingJob(
  deps: KeywordRecorderDeps,
  options: KeywordRecordingJobOptions,
): KeywordRecordingJob {
  const debounceMs = options.debounceMs ?? 60_000;
  let stopped = false;
  let running = false;
  let pendingRerun = false;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const run = async () => {
    if (stopped) {
      return;
    }
    if (running) {
      // 実行中の再要求は完了後に 1 回へ畳む (並行実行で二重予約させない)。
      pendingRerun = true;
      return;
    }
    running = true;
    try {
      const { registered } = await runKeywordRecording(deps);
      if (registered.length > 0) {
        console.error(
          `[keyword-recorder] scheduled ${registered.length} program(s)`,
        );
      }
    } catch (e) {
      console.error("[keyword-recorder] run failed:", e);
    } finally {
      running = false;
      if (pendingRerun && !stopped) {
        pendingRerun = false;
        run();
      }
    }
  };

  run();
  const interval = setInterval(run, options.intervalMs);

  return {
    trigger: () => {
      if (stopped) {
        return;
      }
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        run();
      }, debounceMs);
    },
    stop: () => {
      stopped = true;
      clearInterval(interval);
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
      }
    },
  };
}
