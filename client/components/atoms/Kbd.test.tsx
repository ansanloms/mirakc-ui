import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Kbd from "./Kbd.tsx";

describe("Kbd", () => {
  it("children を <kbd> 要素として描画する", () => {
    render(<Kbd>Ctrl+K</Kbd>);
    const el = screen.getByText("Ctrl+K");
    expect(el.tagName).toBe("KBD");
  });

  it("外から渡した className を併合する", () => {
    const { container } = render(<Kbd className="extra">A</Kbd>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("extra");
    // 自身の module class も残っている（空ではない）。
    expect(el.className.split(" ").length).toBeGreaterThan(1);
  });
});
