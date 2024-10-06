import type { ComponentProps } from "preact";
import { useState } from "preact/hooks";
import LoadingTemplate from "../components/templates/Loading.tsx";
import SearchTemplate from "../components/templates/Search.tsx";
import ProgramModalDetail from "../components/organisms/Program/Modal/Detail.tsx";
import type { components } from "../hooks/api/schema.d.ts";
import * as datetime from "$std/datetime/mod.ts";
import { useDelete, useGet, usePost } from "../hooks/api/index.ts";

type Props = {
  query?: string;
};

export default function Program(props: Props) {
  const [query, setQuery] = useState<string | undefined>(props.query);

  const [selectedProgram, setSelectedProgram] = useState<
    ComponentProps<typeof ProgramModalDetail>["program"] | undefined
  >(undefined);

  const programs = useGet("/programs", {});
  const recordingSchedules = useGet("/recording/schedules", {});

  const addRecordingSchedules = usePost("/recording/schedules");
  const removeRecordingSchedules = useDelete(
    "/recording/schedules/{program_id}",
  );

  const filteringPrograms = (programs.data || []).filter((program) => {
    if (!program) {
      return false;
    }

    if (!query?.trim()) {
      return false;
    }

    for (const target of [program.name, program.description]) {
      if ((target || "").includes(query)) {
        return true;
      }
    }

    return false;
  });

  const handleSetQuery = (query: string | undefined) => {
    const url = new URL(globalThis.location);
    if (query) {
      url.searchParams.set("q", query);
    } else {
      url.searchParams.delete("q");
    }
    history.pushState({}, "", url);

    setQuery(query);
  };

  const handleSetProgram = (
    program: components["schemas"]["MirakurunProgram"] | undefined,
  ) => {
    setSelectedProgram(program);
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

  if (programs.loading) {
    return <LoadingTemplate />;
  }

  return (
    <>
      <SearchTemplate
        query={query}
        programs={filteringPrograms}
        recordingSchedules={recordingSchedules.data || []}
        setQuery={handleSetQuery}
        setProgram={handleSetProgram}
      />
      <ProgramModalDetail
        program={selectedProgram}
        recordingSchedule={(recordingSchedules.data || []).find(
          (recordingSchedule) =>
            recordingSchedule.program.id === selectedProgram?.id,
        )}
        addRecordingSchedule={handleAddRecordingSchedule}
        removeRecordingSchedule={handleRemoveRecordingSchedule}
        loading={recordingSchedules.loading ||
          addRecordingSchedules.loading ||
          removeRecordingSchedules.loading}
        open={!!selectedProgram}
        onClose={() => handleSetProgram(undefined)}
      />
    </>
  );
}
