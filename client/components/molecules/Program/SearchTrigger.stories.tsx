import type { Meta, StoryObj } from "@storybook/react-vite";
import SearchTrigger from "./SearchTrigger.tsx";

const meta = {
  title: "molecules/Program/SearchTrigger",
  component: SearchTrigger,
  args: {
    onOpen: () => {},
  },
} satisfies Meta<typeof SearchTrigger>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
