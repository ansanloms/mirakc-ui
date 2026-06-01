import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import type { ComponentProps } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as datetime from "@std/datetime";
import { $api } from "../lib/api/client.ts";
import type { components } from "../lib/api/schema.d.ts";
import LoadingTemplate from "../components/templates/Loading.tsx";
import RecordingTemplate from "../components/templates/Recording.tsx";
import ProgramModalDetail from "../components/organisms/Program/Modal/Detail.tsx";

export const Route = createFileRoute("/recording")({
  component: RecordingPage,
});

function RecordingPage() {
  const queryClient = useQueryClient();

  const [selectedRecordingSchedule, setSelectedRecordingSchedule] = useState<
    ComponentProps<typeof ProgramModalDetail>["recordingSchedule"] | undefined
  >(undefined);

  const recordingSchedules = $api.useQuery("get", "/recording/schedules");
  const addRecordingSchedule = $api.useMutation(
    "post",
    "/recording/schedules",
  );
  const removeRecordingSchedule = $api.useMutation(
    "delete",
    "/recording/schedules/{program_id}",
  );

  // mutation 後にスケジュール一覧を再取得する。openapi-react-query の queryKey は
  // [method, path] の前方一致で invalidate できる。
  const invalidateSchedules = () =>
    queryClient.invalidateQueries({
      queryKey: ["get", "/recording/schedules"],
    });

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
    setSelectedRecordingSchedule(undefined);
  };

  const handleRemoveRecordingSchedule = async (
    program: components["schemas"]["MirakurunProgram"],
  ) => {
    await removeRecordingSchedule.mutateAsync({
      params: { path: { program_id: program.id } },
    });
    await invalidateSchedules();
    setSelectedRecordingSchedule(undefined);
  };

  if (recordingSchedules.isPending) {
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
        loading={recordingSchedules.isPending ||
          addRecordingSchedule.isPending ||
          removeRecordingSchedule.isPending}
        open={!!selectedRecordingSchedule}
        onClose={() => handleSetRecordingSchedule(undefined)}
      />
    </>
  );
}
