import type { Meta, StoryObj } from "@storybook/react-vite";
import Loading from "./Loading.tsx";

const meta = {
  title: "molecules/Loading",
  component: Loading,
} satisfies Meta<typeof Loading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
