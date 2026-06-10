import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Loading from "./Loading.tsx";

describe("Loading", () => {
  it("label 無しでもクラッシュせず描画される", () => {
    const { container } = render(<Loading />);
    expect(container.firstChild).not.toBeNull();
    // mark + 3 ring + dot の構造が存在する。
    expect(container.querySelectorAll("span").length).toBeGreaterThanOrEqual(4);
  });

  it("label を渡すと説明文を描画する", () => {
    render(<Loading label="番組表を読み込んでいます" />);
    expect(screen.getByText("番組表を読み込んでいます")).toBeTruthy();
  });
});
