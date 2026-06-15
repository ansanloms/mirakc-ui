import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { DEFAULT_NOTIFICATION_SETTINGS } from "../../../server/lib/notification-settings.ts";
import {
  fetchNotificationSettings,
  type NotificationSettings,
  type NotificationTestRequest,
  saveNotificationSettings,
  sendTestNotification,
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
  const test = useMutation({
    mutationFn: (request: NotificationTestRequest) =>
      sendTestNotification(request),
  });

  if (settings.isPending) {
    return <LoadingTemplate label={t("notification.loading")} />;
  }

  return (
    <NotificationTemplate
      settings={settings.data ?? DEFAULT_NOTIFICATION_SETTINGS}
      saving={save.isPending}
      testing={test.isPending}
      onSave={async (input) => {
        await save.mutateAsync(input);
      }}
      onTest={async (request) => {
        await test.mutateAsync(request);
      }}
      onBackToSettings={() => navigate({ to: "/settings" })}
      onOpenWatch={() => navigate({ to: "/watch" })}
      onBack={() => navigate({ to: "/" })}
    />
  );
}
