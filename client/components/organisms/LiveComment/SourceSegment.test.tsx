import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import SourceSegment from "./SourceSegment.tsx";
import { commentSourceLabel } from "../../../lib/comment-source.ts";
import { t } from "../../../locales/i18n.ts";

const SOURCES = ["nicolive", "nx-jikkyo"] as const;

describe("SourceSegment", () => {
  it("取得元ボタンを描画し選択状態を aria-selected で示す", () => {
    render(
      <SourceSegment
        sources={[...SOURCES]}
        selected="nicolive"
        onSelect={() => {}}
      />,
    );
    const nicolive = screen.getByText(commentSourceLabel("nicolive")).closest(
      "button",
    );
    const nx = screen.getByText(commentSourceLabel("nx-jikkyo")).closest(
      "button",
    );
    expect(nicolive?.getAttribute("aria-selected")).toBe("true");
    expect(nx?.getAttribute("aria-selected")).toBe("false");
  });

  it("クリックで onSelect が発火する", () => {
    const onSelect = vi.fn();
    render(
      <SourceSegment
        sources={[...SOURCES]}
        selected="nicolive"
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByText(commentSourceLabel("nx-jikkyo")));
    expect(onSelect).toHaveBeenCalledWith("nx-jikkyo");
  });

  it("選択中の取得元の説明文を表示する", () => {
    render(
      <SourceSegment
        sources={[...SOURCES]}
        selected="nx-jikkyo"
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText(t("liveComment.source.nx-jikkyo.note")))
      .toBeTruthy();
  });
});
