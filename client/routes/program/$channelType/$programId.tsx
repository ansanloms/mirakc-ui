import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { $api } from "../../../lib/api/client.ts";
import type { components } from "../../../lib/api/schema.d.ts";
import { serviceOfProgram } from "../../../lib/service.ts";
import { useProgramQueries } from "../../../hooks/use-program-queries.ts";
import { formatYmdHms } from "../../../lib/datetime.ts";
import ProgramModalDetail from "../../../components/organisms/Program/Modal/Detail.tsx";

type Program = components["schemas"]["MirakurunProgram"];

export const Route = createFileRoute("/program/$channelType/$programId")({
  component: ProgramDetailModal,
});

/** 番組詳細モーダル。URL の programId から対象番組を引いて表示する。 */
function ProgramDetailModal() {
  const { channelType, programId } = Route.useParams();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();

  const { services, programs, recordingSchedules } = useProgramQueries();
  const addRecordingSchedule = $api.useMutation("post", "/recording/schedules");
  const removeRecordingSchedule = $api.useMutation(
    "delete",
    "/recording/schedules/{program_id}",
  );

  const invalidateSchedules = () =>
    queryClient.invalidateQueries({
      queryKey: ["get", "/recording/schedules"],
    });

  const program = (programs.data ?? []).find(
    (p) => String(p.id) === programId,
  );
  const service = program
    ? serviceOfProgram(services.data ?? [], program)
    : undefined;
  const schedule = program
    ? (recordingSchedules.data ?? []).find((s) => s.program.id === program.id)
    : undefined;

  // 閉じる = 番組表 (レイアウト) へ戻る。?d= は保つ。
  const handleClose = () => {
    navigate({
      to: "/program/$channelType",
      params: { channelType },
      search: (prev) => prev,
    });
  };

  const handleAddRecordingSchedule = async (target: Program) => {
    await addRecordingSchedule.mutateAsync({
      body: {
        options: {
          contentPath: `${
            formatYmdHms(target.startAt)
          }_${target.id}_${target.name}.m2ts`,
        },
        programId: target.id,
      },
    });
    await invalidateSchedules();
  };

  const handleRemoveRecordingSchedule = async (target: Program) => {
    await removeRecordingSchedule.mutateAsync({
      params: { path: { program_id: target.id } },
    });
    await invalidateSchedules();
  };

  return (
    <ProgramModalDetail
      program={program}
      service={service}
      recordingSchedule={schedule}
      addRecordingSchedule={handleAddRecordingSchedule}
      removeRecordingSchedule={handleRemoveRecordingSchedule}
      loading={recordingSchedules.isPending ||
        addRecordingSchedule.isPending ||
        removeRecordingSchedule.isPending}
      open={program !== undefined}
      onClose={handleClose}
    />
  );
}
