import { Head } from "fresh/runtime";
import { define } from "../../utils.ts";
import { t } from "../../locales/i18n.ts";
import RecordingIsland from "../../islands/Recording.tsx";

export default define.page(function Recording() {
  return (
    <>
      <Head>
        <title>{t("recording.title")}</title>
      </Head>
      <RecordingIsland />
    </>
  );
});
