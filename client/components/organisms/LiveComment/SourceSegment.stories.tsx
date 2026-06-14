import type { Meta, StoryObj } from "@storybook/react-vite";
import SourceSegment from "./SourceSegment.tsx";

const meta = {
  title: "organisms/LiveComment/SourceSegment",
  component: SourceSegment,
  args: {
    sources: ["nicolive", "nx-jikkyo"],
    selected: "nicolive",
    onSelect: () => {},
  },
} satisfies Meta<typeof SourceSegment>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** NX-Jikkyo を選択中。 */
export const NxJikkyo: Story = {
  args: { selected: "nx-jikkyo" },
};
