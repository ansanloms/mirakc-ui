import LoadingTemplate from "../components/templates/Loading.tsx";
import RecordingTemplate from "../components/templates/Recording.tsx";
import type { components } from "../hooks/api/schema.d.ts";
import { useDelete, useGet } from "../hooks/api/index.ts";

export default function Recording() {
  const recordingSchedules = useGet("/recording/schedules", {});
  const removeRecordingSchedules = useDelete(
    "/recording/schedules/{program_id}",
  );

  const handleRemoveRecordingSchedule = async (
    recordingSchedule: components["schemas"]["WebRecordingSchedule"],
  ) => {
    await removeRecordingSchedules.mutate({
      params: {
        path: {
          program_id: recordingSchedule.program.id,
        },
      },
    });

    await recordingSchedules.mutate({});
  };

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
      />
    </div>
  );
}
