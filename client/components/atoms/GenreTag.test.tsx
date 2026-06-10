import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import GenreTag from "./GenreTag.tsx";
import { genreLabel } from "../../lib/genre.ts";

describe("GenreTag", () => {
  it("genreKey に対応する locales のラベルを描画する", () => {
    render(<GenreTag genreKey="news" />);
    expect(screen.getByText(genreLabel("news"))).toBeTruthy();
  });

  it("genreKey に応じてジャンル色の CSS 変数を style に当てる", () => {
    const { container } = render(<GenreTag genreKey="movie" />);
    const tag = container.firstChild as HTMLElement;
    expect(tag.style.background).toBe("var(--color-genre-movie-fill)");
    expect(tag.style.color).toBe("var(--color-genre-movie-ink)");
    expect(tag.style.borderColor).toBe("var(--color-genre-movie-strong)");
  });

  it("genreKey を変えると参照する変数も変わる", () => {
    const { container } = render(<GenreTag genreKey="anime" />);
    const tag = container.firstChild as HTMLElement;
    expect(tag.style.background).toBe("var(--color-genre-anime-fill)");
  });
});
