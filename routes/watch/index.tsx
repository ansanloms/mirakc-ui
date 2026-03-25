import { Head } from "fresh/runtime";
import { define } from "../../utils.ts";
import { t } from "../../locales/i18n.ts";
import WatchIsland from "../../islands/Watch.tsx";

export default define.page(function Watch() {
  return (
    <>
      <Head>
        <title>{t("watch.title")}</title>
      </Head>
      <WatchIsland />
    </>
  );
});
