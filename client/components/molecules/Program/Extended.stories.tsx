import type { Meta, StoryObj } from "@storybook/react-vite";
import ProgramExtended from "./Extended.tsx";
import { sampleProgram } from "../../../lib/fixtures.ts";

const meta = {
  title: "molecules/Program/Extended",
  component: ProgramExtended,
  args: { program: sampleProgram },
} satisfies Meta<typeof ProgramExtended>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
