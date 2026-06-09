import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import ChannelTypeTabList from "./ChannelTypeTabList.tsx";
import type { ChannelType } from "../../../lib/service.ts";

const meta = {
  title: "molecules/Program/ChannelTypeTabList",
  component: ChannelTypeTabList,
  args: {
    channelType: "GR",
    onChangeChannelType: () => {},
  },
} satisfies Meta<typeof ChannelTypeTabList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const BS: Story = { args: { channelType: "BS" } };

export const SKY: Story = { args: { channelType: "SKY" } };

/** 実際に切り替えられるインタラクティブ版。 */
export const Interactive: Story = {
  render: (args) => {
    const [channelType, setChannelType] = useState<ChannelType>(
      args.channelType,
    );
    return (
      <ChannelTypeTabList
        {...args}
        channelType={channelType}
        onChangeChannelType={setChannelType}
      />
    );
  },
};
