import { Head } from "fresh/runtime";
import { define } from "../../utils.ts";
import { t } from "../../locales/i18n.ts";
import ProgramIsland from "../../islands/Program.tsx";

type Data = {
  targetDate: number;
};

export const handler = define.handlers({
  GET(ctx) {
    const d = ctx.url.searchParams.get("d");

    const targetDate = d && Number.isInteger(Number(d))
      ? Number(d)
      : new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        new Date().getDate(),
        new Date().getHours(),
      ).getTime();

    return { data: { targetDate } };
  },
});

export default define.page(function Program({ data }: { data: Data }) {
  return (
    <>
      <Head>
        <title>{t("program.title")}</title>
      </Head>
      <ProgramIsland targetDate={data.targetDate} />
    </>
  );
});
