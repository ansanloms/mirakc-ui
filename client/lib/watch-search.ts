import { defaultQuality } from "../../server/lib/quality.ts";

/**
 * /watch/$serviceId へ遷移する際の search param の既定値。
 * 番組表・番組詳細・サービス選択など、視聴開始リンクはすべてこれを使う。
 */
export const defaultWatchSearch = {
  audioTrack: 0,
  quality: defaultQuality,
  caption: true,
};
