import { useEffect, useState } from "react";
import type { components } from "../lib/api/schema.d.ts";
import { $api } from "../lib/api/client.ts";
import { useLiveComments } from "../lib/live-comment.ts";
import { nowEpochMs } from "../lib/datetime.ts";
import { t } from "../locales/i18n.ts";
import LoadingTemplate from "../components/templates/Loading.tsx";
import WatchTemplate from "../components/templates/Watch.tsx";
import type {
  BandId,
  ChannelEntry,
} from "../components/organisms/Watch/SelectTab.tsx";
import type { TabId } from "../components/organisms/Watch/TabPanel.tsx";

type Quality = "480p" | "720p" | "1024p";
type Service = components["schemas"]["MirakurunService"];
type Program = components["schemas"]["MirakurunProgram"];

type Props = {
  /** 視聴中サービスの id (int64)。未選択なら undefined。 */
  serviceId?: number;

  audioTrackIndex: number;
  quality: Quality;
  captionVisible: boolean;

  /** サービス選択操作のタイムスタンプ相当 (Player の unmute トリガ)。 */
  serviceSelectedAt: number;

  onSelectService: (service: Service) => void;
  onAudioTrackChange: (index: number) => void;
  onQualityChange: (quality: Quality) => void;
  onCaptionToggle: () => void;
};

/**
 * 指定サービスで現在オンエア中の番組を引く。番組名が無い (= 番組情報を
 * 取得できていない) ものは「番組なし」として扱い undefined を返す。EPG の
 * Table が `!program.name` を落とすのと同じ基準。
 */
function findAiring(
  programs: Program[],
  service: Service,
  now: number,
): Program | undefined {
  return programs.find((program) =>
    !!program.name &&
    program.networkId === service.networkId &&
    program.serviceId === service.serviceId &&
    program.startAt <= now &&
    now < program.startAt + program.duration
  );
}

/** 指定サービスで current の次に始まる番組を引く (番組名のあるもの)。 */
function findNext(
  programs: Program[],
  service: Service,
  current: Program | undefined,
): Program | undefined {
  if (current === undefined) {
    return undefined;
  }
  const after = current.startAt + current.duration;
  return programs
    .filter((program) =>
      !!program.name &&
      program.networkId === service.networkId &&
      program.serviceId === service.serviceId &&
      program.startAt >= after
    )
    .sort((a, b) => a.startAt - b.startAt)[0];
}

/**
 * ライブ視聴ビュー。サービス一覧・番組表を取得し、プレイヤー / 右パネルへ渡す。
 * URL 状態 (serviceId / audioTrack / quality / caption) は route 側が管理する。
 */
export default function Watch(props: Props) {
  const services = $api.useQuery("get", "/services");
  const programs = $api.useQuery("get", "/programs");
  const [band, setBand] = useState<BandId>("GR");
  const [tab, setTab] = useState<TabId>("select");

  const allServices = services.data ?? [];
  const allPrograms = programs.data ?? [];

  const selectedService = props.serviceId !== undefined
    ? allServices.find((service) => service.id === props.serviceId)
    : undefined;

  // 視聴中サービスの band に追従する (チャンネル切替時)。
  useEffect(() => {
    const type = selectedService?.channel.type;
    if (type === "GR" || type === "BS" || type === "CS") {
      setBand(type);
    }
  }, [selectedService?.id]);

  const now = nowEpochMs();
  const currentProgram = selectedService
    ? findAiring(allPrograms, selectedService, now)
    : undefined;

  const live = useLiveComments(currentProgram);

  if (services.isPending) {
    return <LoadingTemplate label={t("watch.loading")} />;
  }

  // A 方式 (#11): mirakc-ui 内部の transcode API を叩く。audioTrack / quality は
  // URL クエリでサーバへ渡され、値変化のたびに streamUrl が変わって Player の
  // effect が再 init する。
  const streamUrl = selectedService
    ? `/api/transcode/services/${selectedService.id}?audioTrack=${props.audioTrackIndex}&quality=${props.quality}`
    : undefined;

  const audios = currentProgram?.audios ??
    (currentProgram?.audio ? [currentProgram.audio] : []);

  const channels: ChannelEntry[] = allServices
    .filter((service) => service.channel.type === band)
    .map((service) => {
      const program = findAiring(allPrograms, service, now);
      const nextProgram = findNext(allPrograms, service, program);
      const progress = program
        ? Math.min(1, Math.max(0, (now - program.startAt) / program.duration))
        : 0;
      return { service, program, nextProgram, progress };
    })
    // 放送中番組 (番組情報) が取得できない局は番組選択に出さない。
    .filter((entry) => entry.program !== undefined);

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
      program={currentProgram}
      service={selectedService}
      band={band}
      onChangeBand={setBand}
      channels={channels}
      activeServiceId={selectedService?.id}
      onSelectService={props.onSelectService}
      tab={tab}
      onChangeTab={setTab}
      comments={live.comments}
      liveConnected={live.connected}
      onPostComment={live.post}
    />
  );
}
