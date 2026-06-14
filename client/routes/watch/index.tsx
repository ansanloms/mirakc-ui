import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { defaultQuality } from "../../../server/lib/quality.ts";
import { defaultWatchSearch } from "../../lib/watch-search.ts";
import { t } from "../../locales/i18n.ts";
import Watch from "../../islands/Watch.tsx";

export const Route = createFileRoute("/watch/")({
  component: WatchIndexPage,
});

function WatchIndexPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = t("watch.title");
  }, []);

  // サービス未選択の状態。サービスリストから選ぶと /watch/$serviceId へ遷移する。
  return (
    <Watch
      onBack={() => navigate({ to: "/program" })}
      onOpenSettings={() => navigate({ to: "/settings" })}
      audioTrackIndex={0}
      quality={defaultQuality}
      captionVisible
      serviceSelectedAt={0}
      onSelectService={(service) =>
        navigate({
          to: "/watch/$serviceId",
          params: { serviceId: String(service.id) },
          search: defaultWatchSearch,
          state: { selected: true },
        })}
      onAudioTrackChange={() => {}}
      onQualityChange={() => {}}
      onCaptionToggle={() => {}}
    />
  );
}
