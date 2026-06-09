import type { Meta, StoryObj } from "@storybook/react-vite";
import ProgramTemplate from "./Program.tsx";
import { withRouter } from "../../lib/storybook.tsx";
import { nowZoned } from "../../lib/datetime.ts";
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
    targetDate: nowZoned(),
    setTargetDate: () => {},
    channelType: "GR",
    onChangeChannelType: () => {},
    onSelectProgram: () => {},
    onOpenSearch: () => {},
  },
} satisfies Meta<typeof ProgramTemplate>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** BS タブ選択時。 */
export const BS: Story = { args: { channelType: "BS" } };
