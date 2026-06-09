import { createFileRoute } from "@tanstack/react-router";
import type { components } from "../../../lib/api/schema.d.ts";
import { serviceOfProgram } from "../../../lib/service.ts";
import { useProgramQueries } from "../../../lib/use-program-queries.ts";
import ProgramSearchModal, {
  type FilterId,
} from "../../../components/organisms/Program/SearchModal.tsx";

type Program = components["schemas"]["MirakurunProgram"];

// ?q=<キーワード> / ?filter=<絞り込み>。?d= はレイアウトから継承する。
// filter は既定 (all) のとき URL から省くため optional にし、読み出し側で "all" に
// 寄せる。
type SearchSearch = { q?: string; filter?: FilterId };

export const Route = createFileRoute("/program/$channelType/search")({
  validateSearch: (search: Record<string, unknown>): SearchSearch => ({
    q: typeof search.q === "string" ? search.q : undefined,
    filter: search.filter === "reserved" ? "reserved" : undefined,
  }),
  component: ProgramSearchModalRoute,
});

/** 番組検索モーダル。?q= / ?filter= を URL 状態として持つ独立ルート。 */
function ProgramSearchModalRoute() {
  const { channelType } = Route.useParams();
  const { q, filter, d } = Route.useSearch();
  const navigate = Route.useNavigate();

  const { services, programs, recordingSchedules } = useProgramQueries();

  // 閉じる = 番組表 (レイアウト) へ戻る。?q= / ?filter= は落とし ?d= は保つ。
  const handleClose = () => {
    navigate({
      to: "/program/$channelType",
      params: { channelType },
      search: { d },
    });
  };

  const handlePick = (program: Program) => {
    const service = serviceOfProgram(services.data ?? [], program);
    const nextChannelType = service?.channel.type ?? channelType;
    navigate({
      to: "/program/$channelType/$programId",
      params: { channelType: nextChannelType, programId: String(program.id) },
      search: { d },
    });
  };

  return (
    <ProgramSearchModal
      open
      onClose={handleClose}
      query={q ?? ""}
      onQueryChange={(value) =>
        navigate({
          search: (prev) => ({ ...prev, q: value || undefined }),
          replace: true,
        })}
      filter={filter ?? "all"}
      onFilterChange={(next) =>
        navigate({
          search: (prev) => ({
            ...prev,
            filter: next === "all" ? undefined : next,
          }),
          replace: true,
        })}
      programs={programs.data ?? []}
      services={services.data ?? []}
      schedules={recordingSchedules.data ?? []}
      onPick={handlePick}
    />
  );
}
