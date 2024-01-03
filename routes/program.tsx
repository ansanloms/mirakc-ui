import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { t } from "../locales/i18n.ts";
import ProgramIsland from "../islands/Program.tsx";

type Data = {
  targetDate: number;
};

export const handler: Handlers<Data> = {
  GET(req, ctx) {
    const d = (new URL(req.url)).searchParams.get("d");

    const targetDate = d && Number.isInteger(Number(d)) ? Number(d) : new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate(),
      new Date().getHours(),
    ).getTime();

    return ctx.render({ targetDate });
  },
};

export default function Program({ data }: PageProps<Data>) {
  return (
    <>
      <Head>
        <title>
          {t("program.title")}
        </title>
      </Head>
      <ProgramIsland targetDate={new Date(data.targetDate)} />
    </>
  );
}
