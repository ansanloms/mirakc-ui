import type { Meta, StoryObj } from "@storybook/react-vite";
import ProgramMarks from "./ProgramMarks.tsx";
import { extractProgramMarks } from "../../lib/program-status.ts";

// 中立 + toned (新/生/映/料) を一通り含むサンプル。
const sample = extractProgramMarks("[新][字][デ][解][生][映][料][SS]").marks;

const meta = {
  title: "atoms/ProgramMarks",
  component: ProgramMarks,
  args: { marks: sample },
} satisfies Meta<typeof ProgramMarks>;

export default meta;

type Story = StoryObj<typeof meta>;

/** 番組表セル内 (コンパクト)。 */
export const Grid: Story = { args: { variant: "grid" } };

/** 見出し末尾にインライン (やや大きめ)。 */
export const Title: Story = {
  args: { variant: "title" },
  decorators: [
    (Story) => (
      <h2 style={{ fontSize: "2.4rem", fontWeight: 700 }}>
        番組タイトル
        <Story />
      </h2>
    ),
  ],
};

/** max で表示数を制限する。 */
export const Limited: Story = { args: { variant: "grid", max: 3 } };

/** 記号が無い場合は何も描画しない。 */
export const Empty: Story = { args: { marks: [] } };
