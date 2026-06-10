import type { Meta, StoryObj } from "@storybook/react-vite";
import InfoTab from "./InfoTab.tsx";
import { sampleProgram, sampleServices } from "../../../lib/fixtures.ts";

const meta = {
  title: "organisms/Watch/InfoTab",
  component: InfoTab,
  args: {
    program: sampleProgram,
    service: sampleServices[1],
  },
  decorators: [
    (Story) => (
      <div
        style={{
          width: "39rem",
          height: "60rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InfoTab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
