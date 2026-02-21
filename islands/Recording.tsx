import type { ComponentProps } from "preact";
import { useState } from "preact/hooks";
import LoadingTemplate from "../components/templates/Loading.tsx";
import RecordingTemplate from "../components/templates/Recording.tsx";
import ProgramModalDetail from "../components/organisms/Program/Modal/Detail.tsx";
import type { components } from "../hooks/api/schema.d.ts";
import * as datetime from "@std/datetime";
import { useDelete, useGet, usePost } from "../hooks/api/index.ts";

export default function Recording() {
  const [selectedRecordingSchedule, setSelectedRecordingSchedule] = useState<
    ComponentProps<typeof ProgramModalDetail>["recordingSchedule"] | undefined
  >(undefined);

  const recordingSchedules = useGet("/recording/schedules", {});
  const addRecordingSchedules = usePost("/recording/schedules");
  const removeRecordingSchedules = useDelete(
    "/recording/schedules/{program_id}",
  );

  const handleSetRecordingSchedule = (
    recordingSchedule:
      | components["schemas"]["WebRecordingSchedule"]
      | undefined,
  ) => {
    setSelectedRecordingSchedule(recordingSchedule);
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
    setSelectedRecordingSchedule(undefined);
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
    setSelectedRecordingSchedule(undefined);
  };

  if (recordingSchedules.loading) {
    return <LoadingTemplate />;
  }

  return (
    <>
      <RecordingTemplate
        recordingSchedules={recordingSchedules.data ?? []}
        setRecordingSchedule={handleSetRecordingSchedule}
      />
      <ProgramModalDetail
        program={selectedRecordingSchedule?.program}
        recordingSchedule={selectedRecordingSchedule}
        addRecordingSchedule={handleAddRecordingSchedule}
        removeRecordingSchedule={handleRemoveRecordingSchedule}
        loading={recordingSchedules.loading ||
          addRecordingSchedules.loading ||
          removeRecordingSchedules.loading}
        open={!!selectedRecordingSchedule}
        onClose={() => handleSetRecordingSchedule(undefined)}
      />
    </>
  );
}
