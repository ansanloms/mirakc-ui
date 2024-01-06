import { useEffect, useState } from "preact/hooks";
import type { ComponentProps } from "preact";
import LoadingTemplate from "../components/templates/Loading.tsx";
import RecordingTemplate from "../components/templates/Recording.tsx";
import type { components } from "../hooks/api/schema.d.ts";
import { useDelete, useGet } from "../hooks/api/index.ts";

export default function Recording() {
  const recordingSchedules = useGet("/recording/schedules", {});

  if (recordingSchedules.loading) {
    return <LoadingTemplate />;
  }

  return (
    <RecordingTemplate
      recordingSchedules={recordingSchedules.data || []}
    />
  );
}
