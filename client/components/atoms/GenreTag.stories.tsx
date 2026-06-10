import type { Meta, StoryObj } from "@storybook/react-vite";
import GenreTag from "./GenreTag.tsx";
import { GENRES } from "../../lib/genre.ts";

const meta = {
  title: "atoms/GenreTag",
  component: GenreTag,
  args: { genreKey: "drama" },
} satisfies Meta<typeof GenreTag>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllGenres: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
      {GENRES.map((g) => <GenreTag key={g.key} genreKey={g.key} />)}
    </div>
  ),
};
