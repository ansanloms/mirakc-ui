import type { Meta, StoryObj } from "@storybook/react-vite";
import ProgramItem from "./Item.tsx";
import { sampleProgram } from "../../../lib/fixtures.ts";

const meta = {
  title: "molecules/Program/Item",
  component: ProgramItem,
  args: { program: sampleProgram },
  decorators: [
    (Story) => (
      <div
        style={{
          position: "relative",
          width: "17rem",
          minHeight: "8rem",
          padding: "0.4rem 0.7rem",
          borderRadius: "0.4rem",
          borderLeft: "4px solid var(--color-genre-drama-strong)",
          background: "var(--color-genre-drama-fill)",
          color: "var(--color-genre-drama-ink)",
        }}
      >
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProgramItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Reserved: Story = { args: { state: "scheduled" } };
export const Recording: Story = { args: { state: "recording" } };
export const Failed: Story = { args: { state: "failed" } };
export const Recorded: Story = { args: { state: "finished" } };

/** 番組名にステータス記号を含む場合。記号はチップ化され、タイトルからは除去される。 */
export const WithMarks: Story = {
  args: {
    program: { ...sampleProgram, name: "報道スペシャル[新][字][デ][生]" },
  },
};
