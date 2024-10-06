import type { ComponentProps } from "preact";
import { t } from "../../locales/i18n.ts";
import SearchList from "../organisms/Search/List.tsx";
import SearchFormQuery from "../organisms/Search/Form/Query.tsx";

type Props = {
  /**
   * 検索値。
   */
  query: string | undefined;

  /**
   * 検索値の更新。
   */
  setQuery: (query: string | undefined) => void;

  /**
   * 番組一覧。
   */
  programs: ComponentProps<typeof SearchList>["programs"];

  /**
   * 録画一覧。
   */
  recordingSchedules: ComponentProps<typeof SearchList>["recordingSchedules"];

  /**
   * 番組を選択する。
   */
  setProgram: ComponentProps<typeof SearchList>["setProgram"];
};

export default function Search(props: Props) {
  const handleSetQuery = (query: Props["query"]) => {
    props.setQuery(query);
  };

  return (
    <div
      class={"container relative h-full mx-auto p-4 grid"}
      style={{ gridTemplateRows: "auto 1fr" }}
    >
      <section class={"grid place-content-center p-8"}>
        <SearchFormQuery
          inputs={{ query: props.query }}
          onSearch={({ query }) => handleSetQuery(query)}
        />
      </section>
      <section class={"flex flex-col gap-4 overflow-auto"}>
        <p>{t("common.unit.subject", { "num": props.programs.length })}</p>
        <SearchList
          programs={props.programs}
          recordingSchedules={props.recordingSchedules}
          setProgram={props.setProgram}
        />
      </section>
    </div>
  );
}
