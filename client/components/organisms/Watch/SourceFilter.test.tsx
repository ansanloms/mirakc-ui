import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import SourceFilter from "./SourceFilter.tsx";
import { commentSourceLabel } from "../../../lib/comment-source.ts";

describe("SourceFilter", () => {
  it("取得元が 1 つなら描画しない", () => {
    const { container } = render(
      <SourceFilter
        sources={["nicolive"]}
        selected={["nicolive"]}
        onToggle={() => {}}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("チップを描画し選択状態を aria-pressed で示す", () => {
    render(
      <SourceFilter
        sources={["nicolive", "nx-jikkyo"]}
        selected={["nicolive"]}
        onToggle={() => {}}
      />,
    );
    const nicolive = screen.getByText(commentSourceLabel("nicolive")).closest(
      "button",
    );
    const nx = screen.getByText(commentSourceLabel("nx-jikkyo")).closest(
      "button",
    );
    expect(nicolive?.getAttribute("aria-pressed")).toBe("true");
    expect(nx?.getAttribute("aria-pressed")).toBe("false");
  });

  it("チップのクリックで onToggle が発火する", () => {
    const onToggle = vi.fn();
    render(
      <SourceFilter
        sources={["nicolive", "nx-jikkyo"]}
        selected={["nicolive"]}
        onToggle={onToggle}
      />,
    );
    fireEvent.click(screen.getByText(commentSourceLabel("nx-jikkyo")));
    expect(onToggle).toHaveBeenCalledWith("nx-jikkyo");
  });
});
