import type { Meta, StoryObj } from "@storybook/react-vite";
import Button from "./Button.tsx";

const meta = {
  title: "atoms/Button",
  component: Button,
  args: {
    children: "Button",
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
