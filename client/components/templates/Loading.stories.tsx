import type { Meta, StoryObj } from "@storybook/react-vite";
import LoadingTemplate from "./Loading.tsx";

const meta = {
  title: "templates/Loading",
  component: LoadingTemplate,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof LoadingTemplate>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
