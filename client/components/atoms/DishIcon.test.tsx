import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import DishIcon from "./DishIcon.tsx";

describe("DishIcon", () => {
  it("size を width/height に反映した svg を描画する", () => {
    const { container } = render(<DishIcon size={64} />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute("width")).toBe("64");
    expect(svg?.getAttribute("height")).toBe("64");
  });

  it("size 未指定なら既定値 (40) を使う", () => {
    const { container } = render(<DishIcon />);
    expect(container.querySelector("svg")?.getAttribute("width")).toBe("40");
  });
});
