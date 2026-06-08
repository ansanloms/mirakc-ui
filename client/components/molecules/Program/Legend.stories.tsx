import type { Meta, StoryObj } from "@storybook/react-vite";
import ProgramLegend from "./Legend.tsx";

const meta = {
  title: "molecules/Program/Legend",
  component: ProgramLegend,
} satisfies Meta<typeof ProgramLegend>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
