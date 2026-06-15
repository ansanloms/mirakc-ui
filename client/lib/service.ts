import type { components } from "./api/schema.d.ts";
import { t } from "../locales/i18n.ts";

type Service = components["schemas"]["MirakurunService"];
type Program = components["schemas"]["MirakurunProgram"];
type Channel = components["schemas"]["MirakurunChannel"];

/** 番組の属するサービス (channel) を networkId / serviceId で引く。 */
export function serviceOfProgram(
  services: Service[],
  program: Program,
): Service | undefined {
  return services.find(
    (service) =>
      service.networkId === program.networkId &&
      service.serviceId === program.serviceId,
  );
}

/** 放送波（channel type）の識別子。mirakc API の ChannelType を再エクスポートする。 */
export type ChannelType = components["schemas"]["ChannelType"];

/**
 * キーワード録画のチャンネル選択・表示で扱う 1 チャンネル。`id` は
 * `MirakurunChannel.channel`、ルールの保存値かつ番組との一致判定キーになる。
 * `services` は配下のフルサービス (バッジの番号・色に必要)。
 */
export type ChannelGroup = {
  /** チャンネル id (MirakurunChannel.channel)。 */
  id: string;
  /** 放送波。 */
  type: ChannelType;
  /** 放送局名 (MirakurunChannel.name)。 */
  name: string;
  /** 配下のサービス。横断録画の対象でありバッジ表示の素。 */
  services: Service[];
};

/**
 * `/channels` (MirakurunChannel[]) を、配下サービスをフル Service に解決した
 * ChannelGroup[] にする。MirakurunChannel.services は番号・色の導出に必要な
 * remoteControlKeyId 等を持たないため、`/services` と (networkId, serviceId)
 * で突き合わせてフル Service に置き換える。解決できないサービスは除く。
 */
export function buildChannelGroups(
  channels: Channel[],
  services: Service[],
): ChannelGroup[] {
  const byKey = new Map(
    services.map((service) => [
      `${service.networkId}:${service.serviceId}`,
      service,
    ]),
  );
  return channels.map((channel) => ({
    id: channel.channel,
    type: channel.type,
    name: channel.name,
    services: channel.services
      .map((s) => byKey.get(`${s.networkId}:${s.serviceId}`))
      .filter((service): service is Service => service !== undefined),
  }));
}

/**
 * 番組表 / 視聴ページのタブで扱う channel type。`channel.type` でサービスを束ねる。
 * mirakc の ChannelType 全 4 種 (GR / BS / CS / SKY) を対象にする。
 */
export const CHANNEL_TYPES: ChannelType[] = ["GR", "BS", "CS", "SKY"];

/** 既定の channel type。リスト先頭を採用する (番組表の redirect 先など)。 */
export const DEFAULT_CHANNEL_TYPE: ChannelType = CHANNEL_TYPES[0];

/** channel type の表示ラベル。文字列は locales（program.channelType）で管理する。 */
export function channelTypeLabel(id: ChannelType): string {
  return t(`program.channelType.${id}`);
}

/**
 * ch バッジに出す番号。リモコン番号を優先し、無ければ serviceId。
 */
export function serviceNumber(service: Service): number {
  return service.remoteControlKeyId ?? service.serviceId;
}

/**
 * ch バッジの色。mirakc はブランドカラーを持たないため、networkId /
 * serviceId から安定した色相を導出する (oklch、白文字が乗る明度)。
 */
export function serviceColor(service: Service): string {
  const seed = (service.networkId * 37 + service.serviceId * 13) % 360;
  return `oklch(0.56 0.13 ${seed})`;
}

/** ロゴ画像 URL (hasLogoData のときのみ)。 */
export function serviceLogoUrl(service: Service): string | undefined {
  return service.hasLogoData
    ? `/api/mirakc/services/${service.id}/logo`
    : undefined;
}
