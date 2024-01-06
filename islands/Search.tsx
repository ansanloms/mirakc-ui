import type { ComponentProps } from "preact";
import { useEffect, useState } from "preact/hooks";
import LoadingTemplate from "../components/templates/Loading.tsx";
import SearchTemplate from "../components/templates/Search.tsx";
import type { components } from "../hooks/api/schema.d.ts";
import * as datetime from "$std/datetime/mod.ts";

import { useDelete, useGet, usePost } from "../hooks/api/index.ts";

type Props = {
  query?: string;
};

export default function Program(props: Props) {
  const [query, setQuery] = useState<string | undefined>(props.query);

  const programs = useGet("/programs", {});
  const recordingSchedules = useGet("/recording/schedules", {});

  const filteringPrograms = (programs.data || []).filter((program) => {
    if (!program) {
      return false;
    }

    if (!query) {
      return false;
    }

    if ((program.description?.indexOf(query) || -1) >= 0) {
      return true;
    }

    if ((program.name?.indexOf(query) || -1) >= 0) {
      return true;
    }

    return false;
  });

  const handleSetQuery = (query: string | undefined) => {
    const url = new URL(window.location);
    if (query) {
      url.searchParams.set("q", query);
    } else {
      url.searchParams.delete("q");
    }
    history.pushState({}, "", url);

    setQuery(query);
  };

  if (programs.loading || recordingSchedules.loading) {
    return <LoadingTemplate />;
  }

  return (
    <SearchTemplate
      query={query}
      programs={filteringPrograms}
      recordingSchedules={recordingSchedules.data || []}
      setQuery={handleSetQuery}
    />
  );
}
