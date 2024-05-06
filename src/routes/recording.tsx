import { Head } from "$fresh/runtime.ts";
import { t } from "../locales/i18n.ts";
import RecordingIsland from "../islands/Recording.tsx";

const Recording = () => {
  return (
    <>
      <Head>
        <title>{t("recording.title")}</title>
      </Head>
      <RecordingIsland />
    </>
  );
};

export default Recording;
