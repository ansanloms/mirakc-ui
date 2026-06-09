import type { components } from "./api/schema.d.ts";
import { t } from "../locales/i18n.ts";

type Service = components["schemas"]["MirakurunService"];
type Program = components["schemas"]["MirakurunProgram"];

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
 * 番組表 / 視聴ページのタブで扱う channel type。`channel.type` でサービスを束ねる。
 * mirakc の ChannelType 全 4 種 (GR / BS / CS / SKY) を対象にする。
 */
export const CHANNEL_TYPES: ChannelType[] = ["GR", "BS", "CS", "SKY"];

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
