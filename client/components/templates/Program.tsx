import type { ReactNode } from "react";
import type { components } from "../../lib/api/schema.d.ts";
import { type ChannelType, channelTypeLabel } from "../../lib/service.ts";
import { startOfHourEpochMs } from "../../lib/datetime.ts";
import { useHotkey } from "../../hooks/use-hotkey.ts";
import { t } from "../../locales/i18n.ts";
import ProgramToolbar from "../organisms/Program/Toolbar.tsx";
import ProgramTable from "../organisms/Program/Table.tsx";
import { SEARCH_HOTKEY } from "../molecules/Program/SearchTrigger.tsx";
import Empty from "../molecules/Empty.tsx";

type Program = components["schemas"]["MirakurunProgram"];
type Service = components["schemas"]["MirakurunService"];
type Schedule = components["schemas"]["WebRecordingSchedule"];

type Props = {
  /** 配局一覧。 */
  services: Service[];

  /** 番組一覧。 */
  programs: Program[];

  /** 録画予約一覧。 */
  recordingSchedules: Schedule[];

  /** 表示日時（タイムゾーン付き）。 */
  targetDate: Temporal.ZonedDateTime;

  /** 表示日時を設定する。 */
  setTargetDate: (targetDate: Temporal.ZonedDateTime) => void;

  /** 現在時刻。番組表の現在時刻ラインに使う。データ源 (route) が注入する。 */
  currentDate: Temporal.ZonedDateTime;

  /** 表示中の channel type (URL のパスに連動)。 */
  channelType: ChannelType;

  /** channel type を切り替える。 */
  onChangeChannelType: (channelType: ChannelType) => void;

  /** 番組を選択する (詳細モーダルへ遷移する)。 */
  onSelectProgram: (program: Program) => void;

  /** 検索モーダルへ遷移する。 */
  onOpenSearch: () => void;

  /** モーダル用のスロット (子ルートの Outlet を流し込む)。 */
  children?: ReactNode;
};

/**
 * 番組表ページ。ツールバー・凡例・グリッドを束ねる。各モーダル (詳細・検索) は
 * 子ルートが描画し、`children` (Outlet) としてこの上に重なる。
 */
export default function Program(props: Props) {
  const channelType = props.channelType;

  // Ctrl/⌘+K で検索モーダルへ。preventDefault でブラウザ既定（Chrome の Ctrl+K =
  // アドレスバー検索）を奪い返す。SearchTrigger が表示するバッジと同じ binding を使う。
  useHotkey(SEARCH_HOTKEY, props.onOpenSearch);

  // targetDate の「時」の先頭を起点に 24 時間分。
  const displayFromMs = startOfHourEpochMs(props.targetDate.epochMilliseconds);
  const displayToMs = displayFromMs + 24 * 60 * 60 * 1000;

  const filteredServices = props.services.filter(
    (service) => service.channel.type === channelType,
  );

  return (
    <div className="app-root">
      <ProgramToolbar
        targetDate={props.targetDate}
        onChangeDate={props.setTargetDate}
        channelType={channelType}
        onChangeChannelType={props.onChangeChannelType}
        onOpenSearch={props.onOpenSearch}
      />
      {filteredServices.length === 0
        ? (
          <Empty
            title={t("program.empty.title", {
              channelType: channelTypeLabel(channelType),
            })}
            description={t("program.empty.description", {
              channelType: channelTypeLabel(channelType),
            })}
          />
        )
        : (
          <ProgramTable
            services={filteredServices}
            programs={props.programs}
            recordingSchedules={props.recordingSchedules}
            displayFromMs={displayFromMs}
            displayToMs={displayToMs}
            setProgram={props.onSelectProgram}
            currentDate={props.currentDate}
          />
        )}

      {props.children}
    </div>
  );
}
