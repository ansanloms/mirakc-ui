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
  interpolation: {
    // i18next 既定の HTML エスケープを無効にする。React が描画時に
    // エスケープするため二重に掛かり、補間値の "/" が &#x2F; のまま
    // 表示されてしまう (例: キーワード一覧の期間チップ "6/1 〜 6/9")。
    escapeValue: false,
  },
});

export const t = i18next.getFixedT(systemLocale);
