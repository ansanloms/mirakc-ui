import type { Meta, StoryObj } from "@storybook/react-vite";
import Settings from "./Settings.tsx";

const meta = {
  title: "templates/Settings",
  component: Settings,
  parameters: { layout: "fullscreen" },
  args: {
    onOpenKeywords: () => {},
    onOpenNotification: () => {},
    onOpenWatch: () => {},
    onBack: () => {},
  },
} satisfies Meta<typeof Settings>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
