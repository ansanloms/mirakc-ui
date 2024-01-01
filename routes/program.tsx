import { Head } from "$fresh/runtime.ts";
import { t } from "../locales/i18n.ts";
import ProgramIsland from "../islands/Program.tsx";

export default function Program() {
  return (
    <>
      <Head>
        <title>
          {t("program.title")}
        </title>
      </Head>
      <ProgramIsland />
    </>
  );
}
