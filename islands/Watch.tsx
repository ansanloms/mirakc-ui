import { useState } from "preact/hooks";
import type { components } from "../hooks/api/schema.d.ts";
import { useGet } from "../hooks/api/index.ts";
import LoadingTemplate from "../components/templates/Loading.tsx";
import WatchTemplate from "../components/templates/Watch.tsx";

type Quality = "480p" | "720p" | "1024p";

type Props = {
  serviceId?: number;
  initialAudioTrackIndex?: number;
  initialQuality?: Quality;
  initialCaptionVisible?: boolean;
};

export default function Watch(props: Props) {
  const [selectedService, setSelectedService] = useState<
    components["schemas"]["MirakurunService"] | undefined
  >(undefined);
  const [initialized, setInitialized] = useState(false);
  const [audioTrackIndex, setAudioTrackIndex] = useState(
    props.initialAudioTrackIndex ?? 0,
  );
  const [quality, setQuality] = useState<Quality>(
    props.initialQuality ?? "720p",
  );
  const [captionVisible, setCaptionVisible] = useState(
    props.initialCaptionVisible ?? true,
  );

  const services = useGet("/services", {});

  if (!initialized && !services.loading && services.data) {
    if (props.serviceId) {
      const found = services.data.find(
        (s: components["schemas"]["MirakurunService"]) =>
          s.id === props.serviceId,
      );
      if (found) {
        setSelectedService(found);
      }
    }
    setInitialized(true);
  }

  const syncUrl = (overrides: {
    serviceId?: number;
    audioTrack?: number;
    quality?: Quality;
    caption?: boolean;
  } = {}) => {
    const url = new URL(globalThis.location.href);

    const sid = overrides.serviceId ?? selectedService?.id;
    url.pathname = sid !== undefined ? `/watch/${sid}` : "/watch";

    const at = overrides.audioTrack ?? audioTrackIndex;
    if (at !== 0) {
      url.searchParams.set("audioTrack", String(at));
    } else {
      url.searchParams.delete("audioTrack");
    }

    const q = overrides.quality ?? quality;
    if (q !== "720p") {
      url.searchParams.set("quality", q);
    } else {
      url.searchParams.delete("quality");
    }

    const cv = overrides.caption ?? captionVisible;
    if (!cv) {
      url.searchParams.set("caption", "false");
    } else {
      url.searchParams.delete("caption");
    }

    history.pushState({}, "", url);
  };

  const handleSetService = (
    service: components["schemas"]["MirakurunService"],
  ) => {
    setSelectedService(service);
    setAudioTrackIndex(0);
    syncUrl({ serviceId: service.id, audioTrack: 0 });
  };

  const handleAudioTrackChange = (index: number) => {
    setAudioTrackIndex(index);
    syncUrl({ audioTrack: index });
  };

  const handleQualityChange = (q: Quality) => {
    setQuality(q);
    syncUrl({ quality: q });
  };

  const handleCaptionToggle = () => {
    const next = !captionVisible;
    setCaptionVisible(next);
    syncUrl({ caption: next });
  };

  if (services.loading) {
    return <LoadingTemplate />;
  }

  const streamUrl = selectedService
    ? `/api/transcode/services/${selectedService.id}?audioTrack=${audioTrackIndex}&quality=${quality}`
    : undefined;

  return (
    <WatchTemplate
      streamUrl={streamUrl}
      audioTrackIndex={audioTrackIndex}
      onAudioTrackChange={handleAudioTrackChange}
      quality={quality}
      onQualityChange={handleQualityChange}
      captionVisible={captionVisible}
      onCaptionToggle={handleCaptionToggle}
      services={services.data ?? []}
      activeServiceId={selectedService?.id}
      setService={handleSetService}
    />
  );
}
