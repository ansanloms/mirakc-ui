import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { $api } from "../../lib/api/client.ts";
import {
  addLiveCommentMapping,
  fetchLiveCommentMappings,
  type LiveCommentMapping,
  removeLiveCommentMapping,
  updateLiveCommentMapping,
} from "../../lib/api/live-comment-settings.ts";
import { buildChannelGroups } from "../../lib/service.ts";
import { planDefaultApply } from "../../lib/live-comment-defaults.ts";
import { LIVE_COMMENT_DEFAULT_REGIONS } from "../../assets/datas/live-comment-defaults.ts";
import { t } from "../../locales/i18n.ts";
import LoadingTemplate from "../../components/templates/Loading.tsx";
import LiveCommentSettingsTemplate from "../../components/templates/LiveCommentSettings.tsx";

export const Route = createFileRoute("/settings/live-comments")({
  component: LiveCommentSettingsPage,
});

/**
 * 実況連携の管理ページ (レイアウト)。割り当ての取得・トグル・削除を行い、
 * 表示は templates/LiveCommentSettings に委ねる。登録/編集モーダルは子ルート
 * (/settings/live-comments/new, /settings/live-comments/$id) が描画し、
 * `<Outlet/>` としてこの上に重なる。/api/live-comment-settings は mirakc-ui
 * 自身の API のため $api ではなく素の TanStack Query を使う (チャンネル選択肢の
 * サービス一覧は mirakc の OpenAPI 由来なので $api)。
 */
function LiveCommentSettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    document.title = t("liveComment.title");
  }, []);

  const mappings = useQuery({
    queryKey: ["live-comment-settings"],
    queryFn: () => fetchLiveCommentMappings(),
  });
  const services = $api.useQuery("get", "/services");
  const channels = $api.useQuery("get", "/channels");

  // カードのバッジ・名前は channel 単位で表示する。配下サービスをフル解決する。
  const channelGroups = useMemo(
    () => buildChannelGroups(channels.data ?? [], services.data ?? []),
    [channels.data, services.data],
  );

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["live-comment-settings"] });

  // 有効/停止トグル (全項目上書きの PUT)。
  const toggle = useMutation({
    mutationFn: (mapping: LiveCommentMapping) => {
      const { id: _id, createdAt: _createdAt, ...input } = mapping;
      return updateLiveCommentMapping(mapping.id, {
        ...input,
        enabled: !mapping.enabled,
      });
    },
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (mapping: LiveCommentMapping) =>
      removeLiveCommentMapping(mapping.id),
    onSuccess: invalidate,
  });

  // デフォルトの一括登録。mirakc に存在する channel だけを対象に、既存は上書き
  // (PUT)・新規は追加 (POST) する。振り分けは planDefaultApply が決める。
  const applyDefaults = useMutation({
    mutationFn: async (regionId: string) => {
      const region = LIVE_COMMENT_DEFAULT_REGIONS.find((r) => r.id === regionId);
      if (region === undefined) {
        return;
      }
      const existing = new Set(channelGroups.map((c) => c.id));
      const plan = planDefaultApply(
        region.mappings,
        existing,
        mappings.data ?? [],
      );
      for (const { id, input } of plan.updates) {
        await updateLiveCommentMapping(id, input);
      }
      for (const input of plan.adds) {
        await addLiveCommentMapping(input);
      }
    },
    onSuccess: invalidate,
  });

  if (mappings.isPending || services.isPending || channels.isPending) {
    return <LoadingTemplate label={t("liveComment.loading")} />;
  }

  return (
    <LiveCommentSettingsTemplate
      mappings={mappings.data ?? []}
      channels={channelGroups}
      busy={toggle.isPending || remove.isPending}
      regions={LIVE_COMMENT_DEFAULT_REGIONS.map(({ id, label }) => ({
        id,
        label,
      }))}
      applyingDefaults={applyDefaults.isPending}
      onApplyDefaults={(regionId) => applyDefaults.mutate(regionId)}
      onAdd={() => navigate({ to: "/settings/live-comments/new" })}
      onEdit={(mapping) =>
        navigate({
          to: "/settings/live-comments/$id",
          params: { id: mapping.id },
        })}
      onToggle={(mapping) => toggle.mutate(mapping)}
      onRemove={(mapping) => remove.mutate(mapping)}
      onBackToSettings={() => navigate({ to: "/settings" })}
      onOpenWatch={() => navigate({ to: "/watch" })}
      onBack={() => navigate({ to: "/" })}
    >
      <Outlet />
    </LiveCommentSettingsTemplate>
  );
}
