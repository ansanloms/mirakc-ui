import type { Meta, StoryObj } from "@storybook/react-vite";
import KeywordRulesTrigger from "./KeywordRulesTrigger.tsx";

const meta = {
  title: "molecules/Program/KeywordRulesTrigger",
  component: KeywordRulesTrigger,
  args: {
    onOpen: () => {},
  },
} satisfies Meta<typeof KeywordRulesTrigger>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
