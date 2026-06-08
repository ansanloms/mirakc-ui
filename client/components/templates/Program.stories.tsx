import type { Meta, StoryObj } from "@storybook/react-vite";
import ProgramTemplate from "./Program.tsx";
import { withRouter } from "../../lib/storybook.tsx";
import {
  samplePrograms,
  sampleSchedules,
  sampleServices,
} from "../../lib/fixtures.ts";

const meta = {
  title: "templates/Program",
  component: ProgramTemplate,
  parameters: { layout: "fullscreen" },
  decorators: [withRouter],
  args: {
    services: sampleServices,
    programs: samplePrograms,
    recordingSchedules: sampleSchedules,
    targetDate: new Date(),
    setTargetDate: () => {},
    selectedProgram: undefined,
    setProgram: () => {},
    addRecordingSchedule: () => {},
    removeRecordingSchedule: () => {},
    recordingLoading: false,
  },
} satisfies Meta<typeof ProgramTemplate>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
