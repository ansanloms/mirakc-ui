import type { Meta, StoryObj } from "@storybook/react-vite";
import RightPanel from "./RightPanel.tsx";

const placeholder = (
  <div style={{ padding: "2rem", color: "var(--color-text-dim)" }}>
    アクティブタブの内容がここに入る
  </div>
);

const meta = {
  title: "organisms/Watch/RightPanel",
  component: RightPanel,
  args: {
    tab: "select",
    onChangeTab: () => {},
    liveCount: 12,
    children: placeholder,
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: "39rem",
          height: "50rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof RightPanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Select: Story = { args: { tab: "select" } };
export const Info: Story = { args: { tab: "info" } };
export const Live: Story = { args: { tab: "live" } };
