import type { ComponentProps } from "preact";
import { useState } from "preact/hooks";
import ProgramTemplate from "../components/templates/Program.tsx";
import LoadingTemplate from "../components/templates/Loading.tsx";
import type { components } from "../hooks/api/schema.ts";
import * as datetime from "std/datetime/mod.ts";

import { useDelete, useGet, usePost } from "../hooks/api/index.ts";

export default function Program() {
  const [selectedDate, setSelectedDate] = useState<
    ComponentProps<typeof ProgramTemplate>["selectedDate"]
  >(
    new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate(),
      new Date().getHours(),
    ),
  );

  const [selectedProgram, setSelectedProgram] = useState<
    components["schemas"]["MirakurunProgram"] | undefined
  >(undefined);

  const [
    selectedProgramRecordingSchedule,
    setSelectedProgramRecordingSchedule,
  ] = useState<
    components["schemas"]["WebRecordingSchedule"] | undefined
  >(undefined);

  const services = useGet(
    "/services",
    {},
  );
  const programs = useGet(
    "/programs",
    {},
  );
  const getRecordingSchedules = useGet("/recording/schedules/{program_id}");
  const addRecordingSchedules = usePost("/recording/schedules");
  const removeRecordingSchedules = useDelete(
    "/recording/schedules/{program_id}",
  );

  const setSelectedProgramRecordingScheduleBySelectedProgram = async (
    program: components["schemas"]["MirakurunProgram"] | undefined,
  ) => {
    if (typeof program === "undefined") {
      setSelectedProgramRecordingSchedule(undefined);
      return;
    }

    const { data, response } = await getRecordingSchedules.mutate({
      params: {
        path: {
          program_id: program.id,
        },
      },
    });

    setSelectedProgramRecordingSchedule(response.ok ? data : undefined);
  };

  const handleSetSelectedProgram = (
    program: components["schemas"]["MirakurunProgram"] | undefined,
  ) => {
    setSelectedProgram(program);
    setSelectedProgramRecordingScheduleBySelectedProgram(program);
  };

  const filteringPrograms = (programs.data || []).filter((program) => {
    if (!program) {
      false;
    }

    const startAt = new Date(program.startAt);
    const from = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      selectedDate.getHours(),
    );
    const to = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate(),
      selectedDate.getHours() + 24,
    );

    return (startAt >= from && startAt <= to) && program.name;
  });

  const filteringServices = (services.data || []).filter((service) =>
    filteringPrograms.some((program) => program.serviceId === service.serviceId)
  );

  const handleAddRecordingSchedule = async (
    program: components["schemas"]["MirakurunProgram"],
  ) => {
    const { data } = await addRecordingSchedules.mutate(
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

    if (program.id === selectedProgram?.id) {
      setSelectedProgramRecordingScheduleBySelectedProgram(program);
    }
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

    if (program.id === selectedProgram?.id) {
      setSelectedProgramRecordingScheduleBySelectedProgram(undefined);
    }
  };

  if (services.loading || programs.loading) {
    return (
      <div>
        <LoadingTemplate />
      </div>
    );
  }

  return (
    <div>
      <ProgramTemplate
        services={filteringServices}
        programs={filteringPrograms}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        setSelectedProgram={handleSetSelectedProgram}
        selectedProgram={selectedProgram}
        addRecordingSchedule={handleAddRecordingSchedule}
        selectedProgramRecordingSchedule={selectedProgramRecordingSchedule}
        removeRecordingSchedule={handleRemoveRecordingSchedule}
        isDuringScheduling={getRecordingSchedules.loading ||
          addRecordingSchedules.loading || removeRecordingSchedules.loading}
      />
    </div>
  );
}
