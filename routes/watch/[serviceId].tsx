import { Head } from "fresh/runtime";
import { define } from "../../utils.ts";
import { t } from "../../locales/i18n.ts";
import WatchIsland from "../../islands/Watch.tsx";

type Data = {
  serviceId: number;
  initialAudioTrackIndex: number;
  initialQuality: "480p" | "720p" | "1024p";
  initialCaptionVisible: boolean;
};

export const handler = define.handlers({
  GET(ctx) {
    const serviceId = Number(ctx.params.serviceId);

    const audioTrackParam = ctx.url.searchParams.get("audioTrack");
    const initialAudioTrackIndex =
      audioTrackParam !== null && Number.isInteger(Number(audioTrackParam))
        ? Math.max(0, Number(audioTrackParam))
        : 0;

    const qualityParam = ctx.url.searchParams.get("quality");
    const initialQuality: "480p" | "720p" | "1024p" =
      qualityParam === "480p" || qualityParam === "720p" ||
        qualityParam === "1024p"
        ? qualityParam
        : "720p";

    const initialCaptionVisible =
      ctx.url.searchParams.get("caption") !== "false";

    return {
      data: {
        serviceId,
        initialAudioTrackIndex,
        initialQuality,
        initialCaptionVisible,
      },
    };
  },
});

export default define.page(function Watch({ data }: { data: Data }) {
  return (
    <>
      <Head>
        <title>{t("watch.title")}</title>
      </Head>
      <WatchIsland
        serviceId={data.serviceId}
        initialAudioTrackIndex={data.initialAudioTrackIndex}
        initialQuality={data.initialQuality}
        initialCaptionVisible={data.initialCaptionVisible}
      />
    </>
  );
});
