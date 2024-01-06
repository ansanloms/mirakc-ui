import type { ComponentProps } from "preact";
import { useState } from "preact/hooks";
import LoadingTemplate from "../components/templates/Loading.tsx";
import ProgramTemplate from "../components/templates/Program.tsx";
import ProgramModalDetail from "../components/organisms/Program/Modal/Detail.tsx";
import type { components } from "../hooks/api/schema.d.ts";
import * as datetime from "$std/datetime/mod.ts";
import { useDelete, useGet, usePost } from "../hooks/api/index.ts";

type Props = {
  /**
   * 表示日時。
   */
  targetDate: number;
};

export default function Program(props: Props) {
  const [targetDate, setTargetDate] = useState<
    ComponentProps<typeof ProgramTemplate>["targetDate"]
  >(new Date(props.targetDate));

  const [selectedProgram, setSelectedProgram] = useState<
    ComponentProps<typeof ProgramModalDetail>["program"] | undefined
  >(undefined);

  const services = useGet("/services", {});
  const programs = useGet("/programs", {});
  const recordingSchedules = useGet("/recording/schedules", {});

  const addRecordingSchedules = usePost("/recording/schedules");
  const removeRecordingSchedules = useDelete(
    "/recording/schedules/{program_id}",
  );

  const handleSetTargetDate = (targetDate: Date) => {
    const url = new URL(window.location);
    url.searchParams.set("d", String(targetDate.getTime()));
    history.pushState({}, "", url);

    setTargetDate(targetDate);
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

  if (services.loading || programs.loading) {
    return <LoadingTemplate />;
  }

  return (
    <>
      <ProgramTemplate
        services={services.data || []}
        programs={programs.data || []}
        recordingSchedules={recordingSchedules.data || []}
        targetDate={targetDate}
        setTargetDate={handleSetTargetDate}
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
