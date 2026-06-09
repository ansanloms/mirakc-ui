import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Button from "./Button.tsx";

describe("Button", () => {
  it("children をラベルとして button に描画する", () => {
    render(<Button>決定</Button>);
    const button = screen.getByRole("button", { name: "決定" });
    expect(button.tagName).toBe("BUTTON");
  });

  it("onClick / type 等の属性を透過する", () => {
    let clicked = 0;
    render(
      <Button type="submit" onClick={() => clicked++}>
        送信
      </Button>,
    );
    const button = screen.getByRole("button", { name: "送信" });
    expect(button.getAttribute("type")).toBe("submit");
    button.click();
    expect(clicked).toBe(1);
  });
});
