import type { Meta, StoryObj } from "@storybook/react-vite";
import WatchTemplate from "./Watch.tsx";
import { withRouter } from "../../lib/storybook.tsx";
import type { components } from "../../lib/api/schema.d.ts";
import {
  DEMO_BASE_MS,
  demoPrograms,
  demoServices,
  sampleLiveComments,
  samplePrograms,
  sampleServices,
} from "../../lib/fixtures.ts";
import { nowEpochMs } from "../../lib/datetime.ts";
import type { ChannelEntry } from "../organisms/Watch/SelectTab.tsx";

type Service = components["schemas"]["MirakurunService"];
type Program = components["schemas"]["MirakurunProgram"];

/** 放送中番組付きの選局リストを組む (GR のみ)。`now` は放送中判定・進行率の基準。 */
function buildChannels(
  services: Service[],
  programs: Program[],
  now: number,
): ChannelEntry[] {
  return services.filter((s) => s.channel.type === "GR").map((service) => {
    const program = programs.find((p) =>
      p.networkId === service.networkId && p.serviceId === service.serviceId &&
      p.startAt <= now && now < p.startAt + p.duration
    );
    const progress = program
      ? Math.min(1, Math.max(0, (now - program.startAt) / program.duration))
      : 0;
    return { service, program, progress };
  });
}

const channels = buildChannels(sampleServices, samplePrograms, nowEpochMs());
const activeService = channels[0]?.service;
const activeProgram = channels[0]?.program;

// README スクリーンショット用 (架空の局・番組のみ)。固定基準時刻に揃えて、開いた
// 時刻に依らず常に同じ放送中番組・進行率になるようにする。
const demoChannels = buildChannels(demoServices, demoPrograms, DEMO_BASE_MS);
const demoActiveService = demoChannels[0]?.service;
const demoActiveProgram = demoChannels[0]?.program;

const meta = {
  title: "templates/Watch",
  component: WatchTemplate,
  parameters: { layout: "fullscreen" },
  decorators: [withRouter],
  args: {
    streamUrl: undefined,
    audioTrackIndex: 0,
    onAudioTrackChange: () => {},
    audios: [],
    quality: "720p",
    onQualityChange: () => {},
    captionVisible: true,
    onCaptionToggle: () => {},
    serviceSelectedAt: 0,
    program: activeProgram,
    service: activeService,
    channelType: "GR",
    onChangeChannelType: () => {},
    channels,
    activeServiceId: activeService?.id,
    onSelectService: () => {},
    tab: "select",
    onChangeTab: () => {},
    comments: sampleLiveComments,
    liveConnected: false,
    liveSources: ["nicolive", "nx-jikkyo"],
    liveSelectedSources: ["nicolive", "nx-jikkyo"],
    onToggleLiveSource: () => {},
  },
} satisfies Meta<typeof WatchTemplate>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Info: Story = { args: { tab: "info" } };
export const Live: Story = { args: { tab: "live", liveConnected: true } };

/** README スクリーンショット用 (選局タブ・架空の局/番組のみ)。 */
export const Demo: Story = {
  args: {
    // service を渡すことで「チャンネルを選択してください」ではなくプレイヤー面
    // (ジャンル色のステージ) を表示する。streamUrl は無し = 実映像は出さない。
    program: demoActiveProgram,
    service: demoActiveService,
    channels: demoChannels,
    activeServiceId: demoActiveService?.id,
    comments: sampleLiveComments,
  },
};

/** README スクリーンショット用 (番組情報タブ・架空の局/番組のみ)。 */
export const DemoInfo: Story = {
  args: {
    ...Demo.args,
    tab: "info",
  },
};
