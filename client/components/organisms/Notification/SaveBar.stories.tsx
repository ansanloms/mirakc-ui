import type { Meta, StoryObj } from "@storybook/react-vite";
import SaveBar from "./SaveBar.tsx";

const meta = {
  title: "organisms/Notification/SaveBar",
  component: SaveBar,
  args: {
    dirty: true,
    saving: false,
    onSave: () => {},
  },
} satisfies Meta<typeof SaveBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Dirty: Story = {};

/** 変更なし (保存不可)。 */
export const Clean: Story = { args: { dirty: false } };

/** 保存中。 */
export const Saving: Story = { args: { saving: true } };

/** 入力エラーで保存不可。 */
export const Invalid: Story = { args: { disabled: true } };
