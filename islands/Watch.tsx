import { useEffect, useState } from "preact/hooks";
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
  // ユーザがサービスリストをクリックしたタイムスタンプ。Player 側で
  // この値変化を検知して muted を解除する (autoplay policy 対策で
  // 直リンクは muted のまま、user gesture 経由は unmute、を分離する)。
  const [serviceSelectedAt, setServiceSelectedAt] = useState(0);

  const services = useGet("/services", {});
  const programs = useGet("/programs", {});

  // services の fetch が完了したら (data / error どちらかで loading が false に
  // なった時点で) 1 回だけ初期化する。render 中の setState は Preact の
  // アンチパターンなので useEffect に寄せる。API エラー時も initialized を
  // true にして永久に loading 画面のままにならないようにする。
  useEffect(() => {
    if (initialized || services.loading) {
      return;
    }
    if (services.data && props.serviceId !== undefined) {
      const found = services.data.find(
        (s: components["schemas"]["MirakurunService"]) =>
          s.id === props.serviceId,
      );
      if (found) {
        setSelectedService(found);
      }
    }
    setInitialized(true);
  }, [initialized, services.loading, services.data, props.serviceId]);

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
    setServiceSelectedAt(Date.now());
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

  // A 方式 (#11): mirakc-ui 内部で ffmpeg + tsreadex を実行する transcode API
  // を呼び出す。`audioTrack` / `quality` は URL クエリでサーバ側に渡され、
  // 値変化のたびに streamUrl が変わって Player.tsx の effect が再 init する。
  const streamUrl = selectedService
    ? `/api/transcode/services/${selectedService.id}?audioTrack=${audioTrackIndex}&quality=${quality}`
    : undefined;

  // 現在オンエア中の番組から audios を抽出。/programs の再 fetch は今のところ
  // 起こらないので、視聴中に番組境界を跨いでも audios は更新されない (要件外)。
  const now = Date.now();
  const currentProgram = selectedService
    ? (programs.data ?? []).find((
      p: components["schemas"]["MirakurunProgram"],
    ) =>
      p.networkId === selectedService.networkId &&
      p.serviceId === selectedService.serviceId &&
      p.startAt <= now &&
      now < p.startAt + p.duration
    )
    : undefined;
  const audios = currentProgram?.audios ??
    (currentProgram?.audio ? [currentProgram.audio] : []);

  return (
    <WatchTemplate
      streamUrl={streamUrl}
      audioTrackIndex={audioTrackIndex}
      onAudioTrackChange={handleAudioTrackChange}
      audios={audios}
      quality={quality}
      onQualityChange={handleQualityChange}
      captionVisible={captionVisible}
      onCaptionToggle={handleCaptionToggle}
      serviceSelectedAt={serviceSelectedAt}
      services={services.data ?? []}
      activeServiceId={selectedService?.id}
      setService={handleSetService}
    />
  );
}
