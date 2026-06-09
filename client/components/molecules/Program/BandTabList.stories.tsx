import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import BandTabList from "./BandTabList.tsx";
import type { BandId } from "../../../lib/service.ts";

const meta = {
  title: "molecules/Program/BandTabList",
  component: BandTabList,
  args: {
    band: "GR",
    onChangeBand: () => {},
  },
} satisfies Meta<typeof BandTabList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const BS: Story = { args: { band: "BS" } };

/** 実際に切り替えられるインタラクティブ版。 */
export const Interactive: Story = {
  render: (args) => {
    const [band, setBand] = useState<BandId>(args.band);
    return <BandTabList {...args} band={band} onChangeBand={setBand} />;
  },
};
