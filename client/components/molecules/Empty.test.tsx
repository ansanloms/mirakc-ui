import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Empty from "./Empty.tsx";

describe("Empty", () => {
  it("title / description を描画し DishIcon (svg) を含む", () => {
    const { container } = render(
      <Empty
        title="放送局がありません"
        description="band を接続してください"
      />,
    );
    expect(screen.getByText("放送局がありません")).toBeTruthy();
    expect(screen.getByText("band を接続してください")).toBeTruthy();
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("compact の有無でコンテナのクラスが変わる", () => {
    const normal = render(<Empty title="t" description="d" />);
    const normalClass = (normal.container.firstChild as HTMLElement).className;
    normal.unmount();

    const compact = render(<Empty title="t" description="d" compact />);
    const compactClass =
      (compact.container.firstChild as HTMLElement).className;

    expect(compactClass).not.toBe(normalClass);
    // compact 時はクラスが追加される (normal は container のみ)。
    expect(compactClass.length).toBeGreaterThan(normalClass.length);
  });
});
