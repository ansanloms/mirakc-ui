import type { Meta, StoryObj } from "@storybook/react-vite";
import WatchTemplate from "./Watch.tsx";
import { withRouter } from "../../lib/storybook.tsx";
import { samplePrograms, sampleServices } from "../../lib/fixtures.ts";
import type { ChannelEntry } from "../organisms/Watch/SelectTab.tsx";
import type { LiveComment } from "../../lib/live-comment.ts";

const now = Date.now();
const grServices = sampleServices.filter((s) => s.channel.type === "GR");

const channels: ChannelEntry[] = grServices.map((service) => {
  const program = samplePrograms.find((p) =>
    p.networkId === service.networkId && p.serviceId === service.serviceId &&
    p.startAt <= now && now < p.startAt + p.duration
  );
  const progress = program
    ? Math.min(1, Math.max(0, (now - program.startAt) / program.duration))
    : 0;
  return { service, program, progress };
});

const activeService = grServices[0];
const activeProgram = channels[0]?.program;

const comments: LiveComment[] = [
  {
    id: "1",
    name: "視聴者A",
    colorHue: 210,
    text: "始まった",
    time: "21:00",
    me: false,
  },
  {
    id: "2",
    name: "視聴者B",
    colorHue: 20,
    text: "おもしろい",
    time: "21:01",
    me: false,
  },
  {
    id: "3",
    name: "あなた",
    colorHue: 210,
    text: "わかる",
    time: "21:02",
    me: true,
  },
];

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
    band: "GR",
    onChangeBand: () => {},
    channels,
    activeServiceId: activeService?.id,
    onSelectService: () => {},
    tab: "select",
    onChangeTab: () => {},
    comments,
    liveConnected: false,
    onPostComment: () => {},
  },
} satisfies Meta<typeof WatchTemplate>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Info: Story = { args: { tab: "info" } };
export const Live: Story = { args: { tab: "live", liveConnected: true } };
