import type { ComponentProps } from "preact";
import { useState } from "preact/hooks";
import SearchTemplate from "../components/templates/Search.tsx";
import type { components } from "../hooks/api/schema.d.ts";
import * as datetime from "$std/datetime/mod.ts";

import { useDelete, useGet, usePost } from "../hooks/api/index.ts";

type Props = {
  query?: string;
};

export default function Program(props: Props) {
  const [query, setQuery] = useState<string | undefined>(props.query);

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

  const handleSetQuery = (value: string) => {
    const url = new URL(window.location);
    url.searchParams.set("q", value);
    history.pushState({}, "", url);

    setQuery(value);
  };

  const handleAddRecordingSchedule = async (
    program: components["schemas"]["MirakurunProgram"],
  ) => {
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
    await removeRecordingSchedules.mutate({
      params: {
        path: {
          program_id: program.id,
        },
      },
    });

    await recordingSchedules.mutate({});
  };

  return (
    <div>
      <SearchTemplate
        query={query}
        programs={filteringPrograms}
        recordingSchedules={recordingSchedules.data || []}
        setQuery={handleSetQuery}
        addRecordingSchedule={handleAddRecordingSchedule}
        removeRecordingSchedule={handleRemoveRecordingSchedule}
      />
    </div>
  );
}
