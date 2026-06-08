import type { Meta, StoryObj } from "@storybook/react-vite";
import ProgramTable from "./Table.tsx";
import { withRouter } from "../../../lib/storybook.tsx";
import {
  samplePrograms,
  sampleSchedules,
  sampleServices,
} from "../../../lib/fixtures.ts";

const from = new Date();
from.setMinutes(0, 0, 0);
from.setHours(from.getHours() - 1);
const to = new Date(from.getTime() + 6 * 60 * 60 * 1000);

const meta = {
  title: "organisms/Program/Table",
  component: ProgramTable,
  parameters: { layout: "fullscreen" },
  decorators: [
    withRouter,
    (Story) => (
      <div
        style={{ display: "flex", flexDirection: "column", height: "60rem" }}
      >
        <Story />
      </div>
    ),
  ],
  args: {
    services: sampleServices,
    programs: samplePrograms,
    recordingSchedules: sampleSchedules,
    displayFrom: from,
    displayTo: to,
    setProgram: () => {},
  },
} satisfies Meta<typeof ProgramTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
