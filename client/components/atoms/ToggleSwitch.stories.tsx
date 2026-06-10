import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import ToggleSwitch from "./ToggleSwitch.tsx";

const meta = {
  title: "atoms/ToggleSwitch",
  component: ToggleSwitch,
  args: {
    checked: true,
    label: "通知",
    onToggle: () => {},
  },
} satisfies Meta<typeof ToggleSwitch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const On: Story = {};

export const Off: Story = { args: { checked: false } };

export const Disabled: Story = { args: { disabled: true } };

/** 実際に切り替えられるインタラクティブ版。 */
export const Interactive: Story = {
  render: (args) => {
    const [checked, setChecked] = useState(args.checked);
    return (
      <ToggleSwitch
        {...args}
        checked={checked}
        onToggle={() => setChecked(!checked)}
      />
    );
  },
};
