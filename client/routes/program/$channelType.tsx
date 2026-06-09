import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import type { components } from "../../lib/api/schema.d.ts";
import {
  CHANNEL_TYPES,
  type ChannelType,
  DEFAULT_CHANNEL_TYPE,
  serviceOfProgram,
} from "../../lib/service.ts";
import { useProgramQueries } from "../../lib/use-program-queries.ts";
import {
  nowEpochMs,
  startOfHourEpochMs,
  zonedFromEpochMs,
} from "../../lib/datetime.ts";
import { t } from "../../locales/i18n.ts";
import LoadingTemplate from "../../components/templates/Loading.tsx";
import ProgramTemplate from "../../components/templates/Program.tsx";

type Program = components["schemas"]["MirakurunProgram"];

/** ?d=<epoch ms> 日付。子ルート (詳細・検索) にも継承される。 */
type ProgramSearch = { d?: number };

/** 既定の表示基準 (本日の現在時。分秒は切り捨て) の epoch ms。 */
function defaultTargetMs(): number {
  return startOfHourEpochMs(nowEpochMs());
}

function isChannelType(value: string): value is ChannelType {
  return (CHANNEL_TYPES as readonly string[]).includes(value);
}

export const Route = createFileRoute("/program/$channelType")({
  // 不正な channel type は既定へ寄せる。
  beforeLoad: ({ params }) => {
    if (!isChannelType(params.channelType)) {
      throw redirect({
        to: "/program/$channelType",
        params: { channelType: DEFAULT_CHANNEL_TYPE },
      });
    }
  },
  validateSearch: (search: Record<string, unknown>): ProgramSearch => ({
    d: search.d !== undefined && Number.isInteger(Number(search.d))
      ? Number(search.d)
      : undefined,
  }),
  component: ProgramLayout,
});

/**
 * 番組表レイアウト。ツールバー + グリッド (番組表) を描画し、詳細 / 検索モーダルは
 * 子ルートが `<Outlet/>` としてこの上に重なる。
 */
function ProgramLayout() {
  const { channelType: rawChannelType } = Route.useParams();
  const { d } = Route.useSearch();
  const navigate = Route.useNavigate();

  // beforeLoad で検証済みのため channel type として確定できる。
  const channelType = rawChannelType as ChannelType;

  useEffect(() => {
    document.title = t("program.title");
  }, []);

  const targetMs = d ?? defaultTargetMs();

  const { services, programs, recordingSchedules } = useProgramQueries();

  // 日付変更は ?d= を更新する。レイアウトのパスへ戻す (モーダルは閉じる)。
  const handleSetTargetDate = (date: Temporal.ZonedDateTime) => {
    navigate({
      to: "/program/$channelType",
      params: { channelType },
      search: { d: date.epochMilliseconds },
    });
  };

  // channel type 切替はパスを変える (詳細・検索モーダルは閉じる)。
  const handleChangeChannelType = (next: ChannelType) => {
    navigate({
      to: "/program/$channelType",
      params: { channelType: next },
      search: (prev) => prev,
    });
  };

  // 番組セルのクリック = 詳細モーダル (子ルート) へ。番組の属する channel type に
  // 合わせて遷移する。
  const handleSelectProgram = (program: Program) => {
    const service = serviceOfProgram(services.data ?? [], program);
    const nextChannelType = service?.channel.type ?? channelType;
    navigate({
      to: "/program/$channelType/$programId",
      params: { channelType: nextChannelType, programId: String(program.id) },
      search: (prev) => prev,
    });
  };

  // 検索モーダル (子ルート) へ。
  const handleOpenSearch = () => {
    navigate({
      to: "/program/$channelType/search",
      params: { channelType },
      search: (prev) => prev,
    });
  };

  if (services.isPending || programs.isPending) {
    return <LoadingTemplate label={t("program.loading")} />;
  }

  return (
    <ProgramTemplate
      services={services.data ?? []}
      programs={programs.data ?? []}
      recordingSchedules={recordingSchedules.data ?? []}
      targetDate={zonedFromEpochMs(targetMs)}
      setTargetDate={handleSetTargetDate}
      channelType={channelType}
      onChangeChannelType={handleChangeChannelType}
      onSelectProgram={handleSelectProgram}
      onOpenSearch={handleOpenSearch}
    >
      <Outlet />
    </ProgramTemplate>
  );
}
