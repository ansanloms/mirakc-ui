import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import IconButton from "./IconButton.tsx";

describe("IconButton", () => {
  it("label を aria-label として設定し icon を描画する", () => {
    render(<IconButton icon="search" label="検索" />);
    const button = screen.getByRole("button", { name: "検索" });
    expect(button.tagName).toBe("BUTTON");
    expect(screen.getByText("search")).toBeTruthy();
  });

  it("クリックで onClick が発火する", () => {
    const onClick = vi.fn();
    render(<IconButton icon="close" label="閉じる" onClick={onClick} />);
    fireEvent.click(screen.getByRole("button", { name: "閉じる" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("disabled では onClick が発火しない", () => {
    const onClick = vi.fn();
    render(
      <IconButton icon="close" label="閉じる" disabled onClick={onClick} />,
    );
    const button = screen.getByRole("button", { name: "閉じる" });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});
