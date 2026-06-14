import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { t } from "../../locales/i18n.ts";
import SettingsTemplate from "../../components/templates/Settings.tsx";

export const Route = createFileRoute("/settings/")({
  component: SettingsPage,
});

/** 設定ポータル。各設定画面 (/settings/*) への入口。 */
function SettingsPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = t("settings.title");
  }, []);

  return (
    <SettingsTemplate
      onOpenKeywords={() => navigate({ to: "/settings/keywords" })}
      onOpenNotification={() => navigate({ to: "/settings/notification" })}
      onOpenWatch={() => navigate({ to: "/watch" })}
      onBack={() => navigate({ to: "/" })}
    />
  );
}
