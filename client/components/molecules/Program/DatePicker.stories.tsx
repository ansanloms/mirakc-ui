import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import ProgramDatePicker from "./DatePicker.tsx";
import { nowZoned } from "../../../lib/datetime.ts";

const meta = {
  title: "molecules/Program/DatePicker",
  component: ProgramDatePicker,
  args: {
    targetDate: nowZoned().startOfDay(),
    onChangeDate: () => {},
  },
} satisfies Meta<typeof ProgramDatePicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 日付を実際に切り替えられるインタラクティブ版。 */
export const Interactive: Story = {
  render: (args) => {
    const [date, setDate] = useState(args.targetDate);
    return (
      <ProgramDatePicker {...args} targetDate={date} onChangeDate={setDate} />
    );
  },
};
