import { useEffect, useState } from "preact/hooks";
import type { ComponentProps } from "preact";
import LoadingTemplate from "../components/templates/Loading.tsx";
import RecordingTemplate from "../components/templates/Recording.tsx";
import type { components } from "../hooks/api/schema.d.ts";
import { useDelete, useGet } from "../hooks/api/index.ts";

export default function Recording() {
  const recordingSchedules = useGet("/recording/schedules", {});
  const removeRecordingSchedules = useDelete(
    "/recording/schedules/{program_id}",
  );

  const [loadings, setLoadings] = useState<
    ComponentProps<typeof RecordingTemplate>["loadings"]
  >([]);

  const handleRemoveRecordingSchedule = async (
    program: components["schemas"]["MirakurunProgram"],
  ) => {
    setLoadings([...loadings, program.id]);

    await removeRecordingSchedules.mutate({
      params: {
        path: {
          program_id: program.id,
        },
      },
    });

    await recordingSchedules.mutate({});
  };

  useEffect((): void => {
    if (!recordingSchedules.loading) {
      setLoadings([]);
    }
  }, [recordingSchedules.loading]);

  if (recordingSchedules.loading) {
    return (
      <div>
        <LoadingTemplate />
      </div>
    );
  }

  return (
    <div>
      <RecordingTemplate
        recordingSchedules={recordingSchedules.data || []}
        removeRecordingSchedule={handleRemoveRecordingSchedule}
        loadings={loadings}
      />
    </div>
  );
}
