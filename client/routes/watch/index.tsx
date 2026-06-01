import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
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
      audioTrackIndex={0}
      quality="720p"
      captionVisible
      serviceSelectedAt={0}
      onSelectService={(service) =>
        navigate({
          to: "/watch/$serviceId",
          params: { serviceId: String(service.id) },
          search: { audioTrack: 0, quality: "720p", caption: true },
          state: { selected: true },
        })}
      onAudioTrackChange={() => {}}
      onQualityChange={() => {}}
      onCaptionToggle={() => {}}
    />
  );
}
