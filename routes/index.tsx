import { Head } from "$fresh/runtime.ts";
import { t } from "../locales/i18n.ts";

export default function Program() {
  return (
    <>
      <Head>
        <title>
          {t("index.title")}
        </title>
      </Head>
    </>
  );
}
