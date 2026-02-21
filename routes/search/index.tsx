import { Head } from "fresh/runtime";
import { define } from "../../utils.ts";
import { t } from "../../locales/i18n.ts";
import SearchIsland from "../../islands/Search.tsx";

type Data = {
  query?: string;
};

export const handler = define.handlers({
  GET(ctx) {
    const query = ctx.url.searchParams.get("q") ?? undefined;

    return { data: { query } };
  },
});

export default define.page(function Search({ data }: { data: Data }) {
  return (
    <>
      <Head>
        <title>{t("search.title")}</title>
      </Head>
      <SearchIsland query={data.query} />
    </>
  );
});
