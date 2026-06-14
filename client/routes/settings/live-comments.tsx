import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { $api } from "../../lib/api/client.ts";
import {
  fetchLiveCommentSettings,
  type LiveCommentSettings,
  saveLiveCommentSettings,
} from "../../lib/api/live-comment-settings.ts";
import { t } from "../../locales/i18n.ts";
import LoadingTemplate from "../../components/templates/Loading.tsx";
import LiveCommentSettingsTemplate from "../../components/templates/LiveCommentSettings.tsx";

export const Route = createFileRoute("/settings/live-comments")({
  component: LiveCommentSettingsPage,
});

/**
 * 実況連携設定ページ。取得元ごとのチャンネル割り当ての取得・保存を行い、
 * 表示は templates/LiveCommentSettings に委ねる。/api/live-comment-settings
 * は mirakc-ui 自身の API のため $api ではなく素の TanStack Query を使う
 * (チャンネル選択肢のサービス一覧は mirakc の OpenAPI 由来なので $api)。
 */
function LiveCommentSettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    document.title = t("liveComment.title");
  }, []);

  const settings = useQuery({
    queryKey: ["live-comment-settings"],
    queryFn: () => fetchLiveCommentSettings(),
  });
  const services = $api.useQuery("get", "/services");

  const save = useMutation({
    mutationFn: (input: LiveCommentSettings) => saveLiveCommentSettings(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["live-comment-settings"] }),
  });

  if (settings.isPending || services.isPending) {
    return <LoadingTemplate label={t("liveComment.loading")} />;
  }

  return (
    <LiveCommentSettingsTemplate
      channels={settings.data?.channels ?? { nicolive: [], "nx-jikkyo": [] }}
      suggestions={settings.data?.suggestions ??
        { nicolive: {}, "nx-jikkyo": {} }}
      services={services.data ?? []}
      saving={save.isPending}
      onSave={async (input) => {
        await save.mutateAsync(input);
      }}
      onBack={() => navigate({ to: "/settings" })}
    />
  );
}
