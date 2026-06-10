import type { Meta, StoryObj } from "@storybook/react-vite";
import ProgramTemplate from "./Program.tsx";
import ProgramSearchModal from "../organisms/Program/SearchModal.tsx";
import ProgramModalDetail from "../organisms/Program/Modal/Detail.tsx";
import { withRouter } from "../../lib/storybook.tsx";
import { nowZoned, zonedFromEpochMs } from "../../lib/datetime.ts";
import {
  DEMO_BASE_MS,
  demoFeaturedProgram,
  demoFeaturedService,
  demoPrograms,
  demoSchedules,
  demoServices,
  samplePrograms,
  sampleSchedules,
  sampleServices,
} from "../../lib/fixtures.ts";

const meta = {
  title: "templates/Program",
  component: ProgramTemplate,
  parameters: { layout: "fullscreen" },
  decorators: [withRouter],
  args: {
    services: sampleServices,
    programs: samplePrograms,
    recordingSchedules: sampleSchedules,
    targetDate: nowZoned(),
    currentDate: nowZoned(),
    setTargetDate: () => {},
    channelType: "GR",
    onChangeChannelType: () => {},
    onSelectProgram: () => {},
    onOpenSearch: () => {},
  },
} satisfies Meta<typeof ProgramTemplate>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** BS タブ選択時。 */
export const BS: Story = { args: { channelType: "BS" } };

// README スクリーンショット用の共有 args。架空の局・番組のみ (実 TV 情報を出さない)。
// 番組・グリッド原点・現在時刻ラインを固定基準時刻 (DEMO_BASE_MS) に揃え、開いた時刻に
// 依らず常に同じ見た目になるようにする。
const demoNow = zonedFromEpochMs(DEMO_BASE_MS);
const demoArgs = {
  services: demoServices,
  programs: demoPrograms,
  recordingSchedules: demoSchedules,
  targetDate: demoNow,
  currentDate: demoNow,
};

/**
 * README スクリーンショット用 (番組表)。実データ近似のジャンル配色・ARIB 記号
 * バッジ・放送中ラインを含む。
 */
export const Demo: Story = { args: demoArgs };

/**
 * README スクリーンショット用 (番組検索ページ)。番組表の上に検索モーダルを重ねた、
 * 実ページと同じ合成。
 */
export const DemoSearch: Story = {
  args: demoArgs,
  render: (args) => (
    <ProgramTemplate {...args}>
      <ProgramSearchModal
        open
        onClose={() => {}}
        query="ニュース"
        onQueryChange={() => {}}
        filter="all"
        onFilterChange={() => {}}
        programs={demoPrograms}
        services={demoServices}
        schedules={demoSchedules}
        onPick={() => {}}
      />
    </ProgramTemplate>
  ),
};

/**
 * README スクリーンショット用 (番組詳細ページ)。番組表の上に番組詳細モーダルを
 * 重ねた、実ページと同じ合成。放送中の番組 (あらすじ・出演者つき) を表示する。
 */
export const DemoDetail: Story = {
  args: demoArgs,
  render: (args) => (
    <ProgramTemplate {...args}>
      <ProgramModalDetail
        open
        program={demoFeaturedProgram}
        service={demoFeaturedService}
        recordingSchedule={undefined}
        addRecordingSchedule={() => {}}
        removeRecordingSchedule={() => {}}
        loading={false}
        currentDate={demoNow}
        onClose={() => {}}
      />
    </ProgramTemplate>
  ),
};
