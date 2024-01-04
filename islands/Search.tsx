import type { ComponentProps } from "preact";
import { useEffect, useState } from "preact/hooks";
import SearchTemplate from "../components/templates/Search.tsx";
import type { components } from "../hooks/api/schema.d.ts";
import * as datetime from "$std/datetime/mod.ts";

import { useDelete, useGet, usePost } from "../hooks/api/index.ts";

type Props = {
  query?: string;
};

export default function Program(props: Props) {
  const [query, setQuery] = useState<string | undefined>(props.query);

  const [loadings, setLoadings] = useState<
    ComponentProps<typeof SearchTemplate>["loadings"]
  >([]);

  const programs = useGet(
    "/programs",
    {},
  );

  const recordingSchedules = useGet("/recording/schedules", {});

  const addRecordingSchedules = usePost("/recording/schedules");
  const removeRecordingSchedules = useDelete(
    "/recording/schedules/{program_id}",
  );

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

  const handleAddRecordingSchedule = async (
    program: components["schemas"]["MirakurunProgram"],
  ) => {
    setLoadings([...loadings, program.id]);

    await addRecordingSchedules.mutate(
      {
        body: {
          options: {
            contentPath: `${
              datetime.format(new Date(program.startAt), "yyyyMMddHHmmss")
            }_${program.id}_${program.name}.m2ts`,
          },
          programId: program.id,
        },
      },
    );

    await recordingSchedules.mutate({});
  };

  const handleRemoveRecordingSchedule = async (
    program: components["schemas"]["MirakurunProgram"],
  ) => {
    setLoadings([...loadings, program.id]);

    await removeRecordingSchedules.mutate({
      params: {
        path: {
          program_id: program.id,
        },
      },
    });

    await recordingSchedules.mutate({});
  };

  useEffect((): void => {
    if (!recordingSchedules.loading) {
      setLoadings([]);
    }
  }, [recordingSchedules.loading]);

  return (
    <div>
      <SearchTemplate
        query={query}
        programs={filteringPrograms}
        recordingSchedules={recordingSchedules.data || []}
        setQuery={handleSetQuery}
        addRecordingSchedule={handleAddRecordingSchedule}
        removeRecordingSchedule={handleRemoveRecordingSchedule}
        loadings={loadings}
      />
    </div>
  );
}
