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
export const Reserved: Story = { args: { reserved: true } };
export const Recorded: Story = { args: { recorded: true } };
