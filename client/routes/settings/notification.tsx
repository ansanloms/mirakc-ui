import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { DEFAULT_NOTIFICATION_SETTINGS } from "../../../server/lib/notification-settings.ts";
import {
  fetchNotificationSettings,
  type NotificationSettings,
  saveNotificationSettings,
  sendTestDiscord,
  sendTestNtfy,
} from "../../lib/api/notification-settings.ts";
import { t } from "../../locales/i18n.ts";
import LoadingTemplate from "../../components/templates/Loading.tsx";
import NotificationTemplate from "../../components/templates/Notification.tsx";

export const Route = createFileRoute("/settings/notification")({
  component: NotificationSettingsPage,
});

/**
 * 通知設定ページ (ntfy / Discord)。設定の取得・保存・テスト送信を行い、表示は
 * templates/Notification に委ねる。/api/notification-settings は
 * mirakc-ui 自身の API のため $api ではなく素の TanStack Query を使う。
 */
function NotificationSettingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    document.title = t("notification.title");
  }, []);

  const settings = useQuery({
    queryKey: ["notification-settings"],
    queryFn: () => fetchNotificationSettings(),
  });

  const save = useMutation({
    mutationFn: (input: NotificationSettings) =>
      saveNotificationSettings(input),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notification-settings"] }),
  });
  const testNtfy = useMutation({
    mutationFn: (target: { url: string; token: string }) =>
      sendTestNtfy(target),
  });
  const testDiscord = useMutation({
    mutationFn: (target: { webhookUrl: string }) => sendTestDiscord(target),
  });

  if (settings.isPending) {
    return <LoadingTemplate label={t("notification.loading")} />;
  }

  return (
    <NotificationTemplate
      settings={settings.data ?? DEFAULT_NOTIFICATION_SETTINGS}
      saving={save.isPending}
      testing={testNtfy.isPending || testDiscord.isPending}
      onSave={async (input) => {
        await save.mutateAsync(input);
      }}
      onTestNtfy={async (target) => {
        await testNtfy.mutateAsync(target);
      }}
      onTestDiscord={async (target) => {
        await testDiscord.mutateAsync(target);
      }}
      onBackToSettings={() => navigate({ to: "/settings" })}
      onOpenWatch={() => navigate({ to: "/watch" })}
      onBack={() => navigate({ to: "/" })}
    />
  );
}
