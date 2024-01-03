import type { ComponentProps } from "preact";
import { useState } from "preact/hooks";
import ProgramTemplate from "../components/templates/Program.tsx";
import LoadingTemplate from "../components/templates/Loading.tsx";
import type { components } from "../hooks/api/schema.d.ts";
import * as datetime from "$std/datetime/mod.ts";

import { useDelete, useGet, usePost } from "../hooks/api/index.ts";

type Props = {
  targetDate: number;
};

export default function Program(props: Props) {
  const [targetDate, setTargetDate] = useState<
    ComponentProps<typeof ProgramTemplate>["targetDate"]
  >(new Date(props.targetDate));

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

  const handleSetTargetDate = (value: Date) => {
    const url = new URL(window.location);
    url.searchParams.set("d", value.getTime());
    history.pushState({}, "", url);

    setTargetDate(value);
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
    const endAt = new Date(program.startAt + program.duration - (60 * 1000)); // 終了時間 = 次の番組の開始時間なので 1 分前を指定。

    const from = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
      targetDate.getHours(),
    );
    const to = new Date(
      targetDate.getFullYear(),
      targetDate.getMonth(),
      targetDate.getDate(),
      targetDate.getHours() + 23,
      targetDate.getMinutes() + 59,
      targetDate.getSeconds() + 59,
    );

    return ((startAt >= from && startAt <= to) ||
      (endAt >= from && endAt <= to)) && program.name;
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
        targetDate={targetDate}
        setTargetDate={handleSetTargetDate}
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
