import type { Meta, StoryObj } from "@storybook/react-vite";
import SourceFilter from "./SourceFilter.tsx";

const meta = {
  title: "organisms/Watch/SourceFilter",
  component: SourceFilter,
  args: {
    sources: ["nicolive", "nx-jikkyo"],
    selected: ["nicolive", "nx-jikkyo"],
    onToggle: () => {},
  },
} satisfies Meta<typeof SourceFilter>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 一部だけ選択。 */
export const Partial: Story = {
  args: { selected: ["nicolive"] },
};
