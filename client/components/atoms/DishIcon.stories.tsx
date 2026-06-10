import type { Meta, StoryObj } from "@storybook/react-vite";
import DishIcon from "./DishIcon.tsx";

const meta = {
  title: "atoms/DishIcon",
  component: DishIcon,
  args: { size: 48 },
} satisfies Meta<typeof DishIcon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
