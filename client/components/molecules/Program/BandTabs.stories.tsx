import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import BandTabs from "./BandTabs.tsx";
import type { BandId } from "../../../lib/service.ts";

const meta = {
  title: "molecules/Program/BandTabs",
  component: BandTabs,
  args: {
    band: "GR",
    onChangeBand: () => {},
  },
} satisfies Meta<typeof BandTabs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const BS: Story = { args: { band: "BS" } };

/** 実際に切り替えられるインタラクティブ版。 */
export const Interactive: Story = {
  render: (args) => {
    const [band, setBand] = useState<BandId>(args.band);
    return <BandTabs {...args} band={band} onChangeBand={setBand} />;
  },
};
