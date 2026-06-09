import type { components } from "./api/schema.d.ts";
import { t } from "../locales/i18n.ts";

type Service = components["schemas"]["MirakurunService"];

/** band（放送波）の識別子。`channel.type` のうちタブで扱う 3 種。 */
export type BandId = "GR" | "BS" | "CS";

/** `channel.type` の全種別（band タブの 3 種 + SKY）。 */
export type ChannelType = BandId | "SKY";

/** チャンネルタイプの表示順 (地上波 → BS → CS → SKY)。 */
export const CHANNEL_TYPE_ORDER: Record<ChannelType, number> = {
  GR: 0,
  BS: 1,
  CS: 2,
  SKY: 3,
};

/** 番組表 / 視聴ページの band タブ。`channel.type` でサービスを束ねる。 */
export const BANDS: BandId[] = ["GR", "BS", "CS"];

/** band の表示ラベル。文字列は locales（program.band）で管理する。 */
export function bandLabel(id: BandId): string {
  return t(`program.band.${id}`);
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
