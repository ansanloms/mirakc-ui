import i18next from "i18next";
import jaJPTranslation from "./ja-JP/translation.ts";

const systemLocale = "ja-JP";

/** アプリのロケール。日時の Intl 整形（曜日名など）でも使う。 */
export const locale = systemLocale;

i18next.init({
  lng: "ja-JP",
  fallbackLng: "ja-JP",
  resources: {
    "ja-JP": {
      translation: jaJPTranslation,
    },
  },
});

export const t = i18next.getFixedT(systemLocale);
