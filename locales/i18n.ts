import i18next from "i18next";
import jaJPTranslation from "./ja-JP/translation.ts";

const systemLocale = "ja-JP";

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
