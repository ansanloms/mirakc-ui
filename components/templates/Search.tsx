import type { ComponentProps, JSX } from "preact";
import SearchList from "../organisms/Search/List.tsx";
import SearchFormQuery from "../organisms/Search/Form/Query.tsx";
import * as datetime from "$std/datetime/mod.ts";

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
};

export default function Search(props: Props) {
  const handleSetQuery = (query: Props["query"]) => {
    props.setQuery(query);
  };

  return (
    <div class={["container", "h-full", "mx-auto", "p-4"]}>
      <section class={["h-48", "grid", "place-content-center"]}>
        <SearchFormQuery
          inputs={{ query: props.query }}
          onChange={({ query }) => handleSetQuery(query)}
        />
      </section>
      <section>
        <SearchList
          programs={props.programs}
          recordingSchedules={props.recordingSchedules}
        />
      </section>
    </div>
  );
}
