import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import LoadingTemplate from "./Loading.tsx";

describe("LoadingTemplate", () => {
  it("label 無しでもクラッシュせず描画する (スモーク)", () => {
    const { container } = render(<LoadingTemplate />);
    expect(container.firstChild).not.toBeNull();
  });

  it("label を渡すと説明文が描画される", () => {
    render(<LoadingTemplate label="番組表を読み込んでいます" />);
    expect(screen.getByText("番組表を読み込んでいます")).toBeTruthy();
  });
});
