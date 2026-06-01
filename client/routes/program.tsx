import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { ComponentProps } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as datetime from "@std/datetime";
import { $api } from "../lib/api/client.ts";
import type { components } from "../lib/api/schema.d.ts";
import { t } from "../locales/i18n.ts";
import LoadingTemplate from "../components/templates/Loading.tsx";
import ProgramTemplate from "../components/templates/Program.tsx";
import ProgramModalDetail from "../components/organisms/Program/Modal/Detail.tsx";

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
  // ?d=<timestamp> を型付き search param として検証する。旧 route handler の
  // GET パラメータ処理がこれに置き換わる。
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

  const [selectedProgram, setSelectedProgram] = useState<
    ComponentProps<typeof ProgramModalDetail>["program"] | undefined
  >(undefined);

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

  const handleAddRecordingSchedule = async (
    program: components["schemas"]["MirakurunProgram"],
  ) => {
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

  const handleRemoveRecordingSchedule = async (
    program: components["schemas"]["MirakurunProgram"],
  ) => {
    await removeRecordingSchedule.mutateAsync({
      params: { path: { program_id: program.id } },
    });
    await invalidateSchedules();
  };

  const handleWatch = (
    program: components["schemas"]["MirakurunProgram"],
  ) => {
    // serviceId (int32) + networkId から MirakurunService を特定し、
    // service.id (int64) で視聴ページへ遷移する。
    const service = (services.data ?? []).find(
      (s) =>
        s.serviceId === program.serviceId && s.networkId === program.networkId,
    );
    if (service) {
      navigate({
        to: "/watch/$serviceId",
        params: { serviceId: String(service.id) },
        search: { audioTrack: 0, quality: "720p", caption: true },
        state: { selected: true },
      });
    }
  };

  if (services.isPending || programs.isPending) {
    return <LoadingTemplate />;
  }

  return (
    <>
      <ProgramTemplate
        services={services.data ?? []}
        programs={programs.data ?? []}
        recordingSchedules={recordingSchedules.data ?? []}
        targetDate={targetDate}
        setTargetDate={handleSetTargetDate}
        setProgram={setSelectedProgram}
      />
      <ProgramModalDetail
        program={selectedProgram}
        recordingSchedule={(recordingSchedules.data ?? []).find(
          (recordingSchedule) =>
            recordingSchedule.program.id === selectedProgram?.id,
        )}
        addRecordingSchedule={handleAddRecordingSchedule}
        removeRecordingSchedule={handleRemoveRecordingSchedule}
        onWatch={handleWatch}
        loading={recordingSchedules.isPending ||
          addRecordingSchedule.isPending ||
          removeRecordingSchedule.isPending}
        open={!!selectedProgram}
        onClose={() => setSelectedProgram(undefined)}
      />
    </>
  );
}
