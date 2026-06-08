import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as datetime from "@std/datetime";
import { $api } from "../lib/api/client.ts";
import type { components } from "../lib/api/schema.d.ts";
import { t } from "../locales/i18n.ts";
import LoadingTemplate from "../components/templates/Loading.tsx";
import ProgramTemplate from "../components/templates/Program.tsx";

type Program = components["schemas"]["MirakurunProgram"];
type ProgramSearch = { d?: number };

/** 既定の表示基準日時 (本日の現在時。分秒は切り捨て)。 */
function defaultTargetDate(): number {
  const now = new Date();
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours(),
  ).getTime();
}

export const Route = createFileRoute("/program")({
  // ?d=<timestamp> を型付き search param として検証する。
  validateSearch: (search: Record<string, unknown>): ProgramSearch => ({
    d: search.d !== undefined && Number.isInteger(Number(search.d))
      ? Number(search.d)
      : undefined,
  }),
  component: ProgramPage,
});

function ProgramPage() {
  const { d } = Route.useSearch();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    document.title = t("program.title");
  }, []);

  const targetDate = new Date(d ?? defaultTargetDate());

  const [selectedProgram, setSelectedProgram] = useState<Program | undefined>(
    undefined,
  );

  const services = $api.useQuery("get", "/services");
  const programs = $api.useQuery("get", "/programs");
  const recordingSchedules = $api.useQuery("get", "/recording/schedules");
  const addRecordingSchedule = $api.useMutation("post", "/recording/schedules");
  const removeRecordingSchedule = $api.useMutation(
    "delete",
    "/recording/schedules/{program_id}",
  );

  const invalidateSchedules = () =>
    queryClient.invalidateQueries({
      queryKey: ["get", "/recording/schedules"],
    });

  const handleSetTargetDate = (date: Date) => {
    navigate({ search: { d: date.getTime() } });
  };

  const handleAddRecordingSchedule = async (program: Program) => {
    await addRecordingSchedule.mutateAsync({
      body: {
        options: {
          contentPath: `${
            datetime.format(new Date(program.startAt), "yyyyMMddHHmmss")
          }_${program.id}_${program.name}.m2ts`,
        },
        programId: program.id,
      },
    });
    await invalidateSchedules();
  };

  const handleRemoveRecordingSchedule = async (program: Program) => {
    await removeRecordingSchedule.mutateAsync({
      params: { path: { program_id: program.id } },
    });
    await invalidateSchedules();
  };

  if (services.isPending || programs.isPending) {
    return <LoadingTemplate label={t("program.loading")} />;
  }

  return (
    <ProgramTemplate
      services={services.data ?? []}
      programs={programs.data ?? []}
      recordingSchedules={recordingSchedules.data ?? []}
      targetDate={targetDate}
      setTargetDate={handleSetTargetDate}
      selectedProgram={selectedProgram}
      setProgram={setSelectedProgram}
      addRecordingSchedule={handleAddRecordingSchedule}
      removeRecordingSchedule={handleRemoveRecordingSchedule}
      recordingLoading={recordingSchedules.isPending ||
        addRecordingSchedule.isPending ||
        removeRecordingSchedule.isPending}
    />
  );
}
