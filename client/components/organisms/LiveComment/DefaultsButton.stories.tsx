import type { Meta, StoryObj } from "@storybook/react-vite";
import DefaultsButton from "./DefaultsButton.tsx";

const meta = {
  title: "organisms/LiveComment/DefaultsButton",
  component: DefaultsButton,
  args: {
    regions: [{ id: "kanto", label: "関東" }],
    onApply: () => {},
  },
} satisfies Meta<typeof DefaultsButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 複数地域 (将来の拡張イメージ)。 */
export const MultiRegion: Story = {
  args: {
    regions: [
      { id: "kanto", label: "関東" },
      { id: "kansai", label: "関西" },
    ],
  },
};

/** 登録処理中。 */
export const Busy: Story = { args: { busy: true } };
