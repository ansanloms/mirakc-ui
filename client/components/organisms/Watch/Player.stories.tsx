import type { Meta, StoryObj } from "@storybook/react-vite";
import WatchPlayer from "./Player.tsx";
import { sampleProgram, sampleServices } from "../../../lib/fixtures.ts";

const meta = {
  title: "organisms/Watch/Player",
  component: WatchPlayer,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: "80rem", margin: "0 auto" }}>
        <Story />
      </div>
    ),
  ],
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
    program: sampleProgram,
    service: sampleServices[1],
  },
} satisfies Meta<typeof WatchPlayer>;

export default meta;

type Story = StoryObj<typeof meta>;

/** ストリーム未選択時のプレースホルダ。 */
export const Placeholder: Story = {
  args: { program: undefined, service: undefined },
};

/**
 * ジャンルグラデの stage + クローム (ホバー/フォーカスで表示)。
 * streamUrl はダミーのため実映像は出ない。
 */
export const Live: Story = {
  args: { streamUrl: "https://example.invalid/stream.ts" },
};
