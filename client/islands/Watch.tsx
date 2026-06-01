import type { components } from "../lib/api/schema.d.ts";
import { $api } from "../lib/api/client.ts";
import LoadingTemplate from "../components/templates/Loading.tsx";
import WatchTemplate from "../components/templates/Watch.tsx";

type Quality = "480p" | "720p" | "1024p";

type Props = {
  /** 視聴中サービスの id (int64)。未選択なら undefined。 */
  serviceId?: number;

  audioTrackIndex: number;
  quality: Quality;
  captionVisible: boolean;

  /**
   * サービス選択操作のタイムスタンプ相当 (Player の unmute トリガ)。
   * route 側で「リスト選択由来か直リンクか」を判定して渡す。0 は直リンク扱い。
   */
  serviceSelectedAt: number;

  onSelectService: (service: components["schemas"]["MirakurunService"]) => void;
  onAudioTrackChange: (index: number) => void;
  onQualityChange: (quality: Quality) => void;
  onCaptionToggle: () => void;
};

/**
 * ライブ視聴ビュー。サービス一覧とプレイヤーを束ねる。URL 状態 (serviceId /
 * audioTrack / quality / caption) は route 側が TanStack Router で管理し、
 * このコンポーネントは値とコールバックを props で受け取る純粋な表示層。
 */
export default function Watch(props: Props) {
  const services = $api.useQuery("get", "/services");
  const programs = $api.useQuery("get", "/programs");

  if (services.isPending) {
    return <LoadingTemplate />;
  }

  const selectedService = props.serviceId !== undefined
    ? (services.data ?? []).find((s) => s.id === props.serviceId)
    : undefined;

  // A 方式 (#11): mirakc-ui 内部の transcode API を叩く。audioTrack / quality は
  // URL クエリでサーバへ渡され、値変化のたびに streamUrl が変わって Player.tsx の
  // effect が再 init する。
  const streamUrl = selectedService
    ? `/api/transcode/services/${selectedService.id}?audioTrack=${props.audioTrackIndex}&quality=${props.quality}`
    : undefined;

  // 現在オンエア中の番組から audios を抽出する。
  const now = Date.now();
  const currentProgram = selectedService
    ? (programs.data ?? []).find((p) =>
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
      audioTrackIndex={props.audioTrackIndex}
      onAudioTrackChange={props.onAudioTrackChange}
      audios={audios}
      quality={props.quality}
      onQualityChange={props.onQualityChange}
      captionVisible={props.captionVisible}
      onCaptionToggle={props.onCaptionToggle}
      serviceSelectedAt={props.serviceSelectedAt}
      services={services.data ?? []}
      activeServiceId={selectedService?.id}
      setService={props.onSelectService}
    />
  );
}
