import { Head } from "fresh/runtime";
import { define } from "../utils.ts";
import { t } from "../locales/i18n.ts";

export default define.page(function Home() {
  return (
    <>
      <Head>
        <title>{t("index.title")}</title>
      </Head>
    </>
  );
});
