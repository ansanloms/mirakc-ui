import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import ProgramToolbar from "./Toolbar.tsx";

const meta = {
  title: "organisms/Program/Toolbar",
  component: ProgramToolbar,
  args: {
    targetDate: new Date(),
    band: "GR",
    onChangeDate: () => {},
    onChangeBand: () => {},
    onOpenSearch: () => {},
  },
} satisfies Meta<typeof ProgramToolbar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** band を BS にした状態。 */
export const BandBS: Story = { args: { band: "BS" } };

/** 日付・band を実際に切り替えられるインタラクティブ版。 */
export const Interactive: Story = {
  render: (args) => {
    const [date, setDate] = useState(args.targetDate);
    const [band, setBand] = useState(args.band);
    return (
      <ProgramToolbar
        {...args}
        targetDate={date}
        onChangeDate={setDate}
        band={band}
        onChangeBand={setBand}
      />
    );
  },
};
