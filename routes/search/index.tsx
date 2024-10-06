import { Head } from "$fresh/runtime.ts";
import { Handlers, PageProps } from "$fresh/server.ts";
import { t } from "../../locales/i18n.ts";
import SearchIsland from "../../islands/Search.tsx";

type Data = {
  query?: string;
};

export const handler: Handlers<Data> = {
  GET(req, ctx) {
    const query = (new URL(req.url)).searchParams.get("q") || undefined;

    return ctx.render({ query });
  },
};

export default function Program({ data }: PageProps<Data>) {
  return (
    <>
      <Head>
        <title>
          {t("search.title")}
        </title>
      </Head>
      <SearchIsland query={data.query} />
    </>
  );
}
