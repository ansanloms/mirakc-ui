import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import ProgramToolbar from "./Toolbar.tsx";
import { nowZoned } from "../../../lib/datetime.ts";

const meta = {
  title: "organisms/Program/Toolbar",
  component: ProgramToolbar,
  args: {
    targetDate: nowZoned().startOfDay(),
    channelType: "GR",
    onChangeDate: () => {},
    onChangeChannelType: () => {},
    onOpenSearch: () => {},
    onOpenWatch: () => {},
    onOpenSettings: () => {},
  },
} satisfies Meta<typeof ProgramToolbar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** channel type を BS にした状態。 */
export const ChannelTypeBS: Story = { args: { channelType: "BS" } };

/** 日付・channel type を実際に切り替えられるインタラクティブ版。 */
export const Interactive: Story = {
  render: (args) => {
    const [date, setDate] = useState(args.targetDate);
    const [channelType, setChannelType] = useState(args.channelType);
    return (
      <ProgramToolbar
        {...args}
        targetDate={date}
        onChangeDate={setDate}
        channelType={channelType}
        onChangeChannelType={setChannelType}
      />
    );
  },
};
