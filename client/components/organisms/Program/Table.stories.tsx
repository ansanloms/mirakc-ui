import type { Meta, StoryObj } from "@storybook/react-vite";
import ProgramTable from "./Table.tsx";
import { withRouter } from "../../../lib/storybook.tsx";
import {
  nowEpochMs,
  nowZoned,
  startOfHourEpochMs,
} from "../../../lib/datetime.ts";
import {
  samplePrograms,
  sampleSchedules,
  sampleServices,
} from "../../../lib/fixtures.ts";

// 現在の正時の 1 時間前を起点に 6 時間分の表示窓。
const fromMs = startOfHourEpochMs(nowEpochMs()) - 60 * 60 * 1000;
const toMs = fromMs + 6 * 60 * 60 * 1000;

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
    displayFromMs: fromMs,
    displayToMs: toMs,
    setProgram: () => {},
    currentDate: nowZoned(),
  },
} satisfies Meta<typeof ProgramTable>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
