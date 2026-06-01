import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { ComponentProps } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as datetime from "@std/datetime";
import { $api } from "../lib/api/client.ts";
import type { components } from "../lib/api/schema.d.ts";
import { t } from "../locales/i18n.ts";
import LoadingTemplate from "../components/templates/Loading.tsx";
import SearchTemplate from "../components/templates/Search.tsx";
import ProgramModalDetail from "../components/organisms/Program/Modal/Detail.tsx";

type SearchSearch = { q?: string };

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchSearch => ({
    q: typeof search.q === "string" && search.q ? search.q : undefined,
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    document.title = t("search.title");
  }, []);

  const [selectedProgram, setSelectedProgram] = useState<
    ComponentProps<typeof ProgramModalDetail>["program"] | undefined
  >(undefined);

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

  // query にマッチする番組のみ抽出する。query が空なら何も表示しない。
  const filteredPrograms = (programs.data ?? []).filter((program) => {
    if (!program || !q?.trim()) {
      return false;
    }
    return [program.name, program.description].some((target) =>
      (target ?? "").includes(q)
    );
  });

  const handleSetQuery = (query: string | undefined) => {
    navigate({ search: query ? { q: query } : {} });
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

  if (programs.isPending) {
    return <LoadingTemplate />;
  }

  return (
    <>
      <SearchTemplate
        query={q}
        programs={filteredPrograms}
        recordingSchedules={recordingSchedules.data ?? []}
        setQuery={handleSetQuery}
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
        loading={recordingSchedules.isPending ||
          addRecordingSchedule.isPending ||
          removeRecordingSchedule.isPending}
        open={!!selectedProgram}
        onClose={() => setSelectedProgram(undefined)}
      />
    </>
  );
}
