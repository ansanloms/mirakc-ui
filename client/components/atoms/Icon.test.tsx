import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Icon from "./Icon.tsx";

describe("Icon", () => {
  it("children (material symbol 名) を描画する", () => {
    render(<Icon>home</Icon>);
    const el = screen.getByText("home");
    expect(el.classList.contains("material-symbols-outlined")).toBe(true);
  });

  it("spin=true で animate-spin クラスが付く", () => {
    render(<Icon spin>refresh</Icon>);
    expect(screen.getByText("refresh").classList.contains("animate-spin"))
      .toBe(true);
  });

  it("spin 未指定なら animate-spin クラスは付かない", () => {
    render(<Icon>refresh</Icon>);
    expect(screen.getByText("refresh").classList.contains("animate-spin"))
      .toBe(false);
  });

  it("size を fontSize / width に反映する", () => {
    render(<Icon size={32}>star</Icon>);
    const el = screen.getByText("star") as HTMLElement;
    expect(el.style.fontSize).toBe("32px");
    expect(el.style.width).toBe("32px");
  });
});
