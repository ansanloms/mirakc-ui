import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { t } from "../locales/i18n.ts";
import ProgramIsland from "../islands/Program.tsx";

type Data = {
  targetDate: number;
};

export const handler: Handlers<Data> = {
  GET(req, ctx) {
    const searchParams = (new URL(req.url)).searchParams;
    const d = searchParams.get("d");
    const p = searchParams.get("p");

    const targetDate = d && Number.isInteger(Number(d)) ? Number(d) : new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate(),
      new Date().getHours(),
    ).getTime();

    const program = Number.isInteger(Number(p)) ? Number(p) : -1;

    return ctx.render({ targetDate, program });
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
      <ProgramIsland targetDate={data.targetDate} program={data.program} />
    </>
  );
}
