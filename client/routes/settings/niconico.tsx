import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { $api } from "../../lib/api/client.ts";
import {
  fetchNiconicoSettings,
  type NiconicoSettings,
  saveNiconicoSettings,
} from "../../lib/api/niconico-settings.ts";
import { t } from "../../locales/i18n.ts";
import LoadingTemplate from "../../components/templates/Loading.tsx";
import NiconicoTemplate from "../../components/templates/Niconico.tsx";

export const Route = createFileRoute("/settings/niconico")({
  component: NiconicoSettingsPage,
});

/**
 * ニコニコ実況連携設定ページ。設定の取得・保存を行い、表示は
 * templates/Niconico に委ねる。/api/niconico-settings は mirakc-ui 自身の
 * API のため $api ではなく素の TanStack Query を使う (チャンネル選択肢の
 * サービス一覧は mirakc の OpenAPI 由来なので $api)。
 */
function NiconicoSettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    document.title = t("niconico.title");
  }, []);

  const settings = useQuery({
    queryKey: ["niconico-settings"],
    queryFn: () => fetchNiconicoSettings(),
  });
  const services = $api.useQuery("get", "/services");

  const save = useMutation({
    mutationFn: (input: NiconicoSettings) => saveNiconicoSettings(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["niconico-settings"] }),
  });

  if (settings.isPending || services.isPending) {
    return <LoadingTemplate label={t("niconico.loading")} />;
  }

  return (
    <NiconicoTemplate
      channels={settings.data?.channels ?? []}
      suggestions={settings.data?.suggestions ?? {}}
      services={services.data ?? []}
      saving={save.isPending}
      onSave={async (input) => {
        await save.mutateAsync(input);
      }}
      onBack={() => navigate({ to: "/settings" })}
    />
  );
}
