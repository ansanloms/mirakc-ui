import { createFileRoute, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { t } from "../../locales/i18n.ts";
import Watch from "../../islands/Watch.tsx";

type Quality = "480p" | "720p" | "1024p";
type WatchSearch = { audioTrack: number; quality: Quality; caption: boolean };

function normalizeQuality(value: unknown): Quality {
  return value === "480p" || value === "720p" || value === "1024p"
    ? value
    : "720p";
}

export const Route = createFileRoute("/watch/$serviceId")({
  // audioTrack / quality / caption を型付き search param として検証する。
  // 旧 routes/watch/[serviceId].tsx の GET パラメータ処理がこれに置き換わる。
  validateSearch: (search: Record<string, unknown>): WatchSearch => ({
    audioTrack: Number.isInteger(Number(search.audioTrack))
      ? Math.max(0, Number(search.audioTrack))
      : 0,
    quality: normalizeQuality(search.quality),
    caption: search.caption !== false && search.caption !== "false",
  }),
  component: WatchServicePage,
});

function WatchServicePage() {
  const { serviceId } = Route.useParams();
  const { audioTrack, quality, caption } = Route.useSearch();
  const navigate = Route.useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.title = t("watch.title");
  }, []);

  // リスト選択由来の遷移のみ history state に selected:true が乗る。直リンク
  // (state 無し) は muted のまま autoplay を通すため serviceSelectedAt=0 にする。
  const gesture = (location.state as { selected?: boolean })?.selected ?? false;
  const sid = Number(serviceId);

  return (
    <Watch
      serviceId={sid}
      audioTrackIndex={audioTrack}
      quality={quality}
      captionVisible={caption}
      serviceSelectedAt={gesture ? sid : 0}
      onSelectService={(service) =>
        navigate({
          to: "/watch/$serviceId",
          params: { serviceId: String(service.id) },
          search: { audioTrack: 0, quality: "720p", caption: true },
          state: { selected: true },
        })}
      onAudioTrackChange={(index) =>
        navigate({ search: (prev) => ({ ...prev, audioTrack: index }) })}
      onQualityChange={(q) =>
        navigate({ search: (prev) => ({ ...prev, quality: q }) })}
      onCaptionToggle={() =>
        navigate({ search: (prev) => ({ ...prev, caption: !prev.caption }) })}
    />
  );
}
