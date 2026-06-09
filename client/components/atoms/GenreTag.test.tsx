import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import GenreTag from "./GenreTag.tsx";

describe("GenreTag", () => {
  it("label を描画する", () => {
    render(<GenreTag genreKey="news" label="報道" />);
    expect(screen.getByText("報道")).toBeTruthy();
  });

  it("genreKey に応じてジャンル色の CSS 変数を style に当てる", () => {
    const { container } = render(<GenreTag genreKey="movie" label="映画" />);
    const tag = container.firstChild as HTMLElement;
    expect(tag.style.background).toBe("var(--color-genre-movie-fill)");
    expect(tag.style.color).toBe("var(--color-genre-movie-ink)");
    expect(tag.style.borderColor).toBe("var(--color-genre-movie-strong)");
  });

  it("genreKey を変えると参照する変数も変わる", () => {
    const { container } = render(<GenreTag genreKey="anime" label="アニメ" />);
    const tag = container.firstChild as HTMLElement;
    expect(tag.style.background).toBe("var(--color-genre-anime-fill)");
  });
});
