import { $api } from "../lib/api/client.ts";

/**
 * 番組表ページ (番組表レイアウト・詳細モーダル・検索モーダル) が共通で使う読み取り
 * クエリ。サービス・番組・録画予約の 3 本をまとめて返す。各ルートで個別に呼んでも
 * TanStack Query が同一 queryKey でキャッシュ共有するため、ネットワークは 1 回で済む。
 */
export function useProgramQueries() {
  const services = $api.useQuery("get", "/services");
  const programs = $api.useQuery("get", "/programs");
  const recordingSchedules = $api.useQuery("get", "/recording/schedules");
  return { services, programs, recordingSchedules };
}
