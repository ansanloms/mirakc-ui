import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ToggleSwitch from "./ToggleSwitch.tsx";

describe("ToggleSwitch", () => {
  it("role=switch と aria-checked を持ちクリックで onToggle が発火する", () => {
    const onToggle = vi.fn();
    render(<ToggleSwitch checked={false} label="通知" onToggle={onToggle} />);

    const sw = screen.getByRole("switch", { name: "通知" });
    expect(sw.getAttribute("aria-checked")).toBe("false");

    fireEvent.click(sw);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("checked で aria-checked が true になる", () => {
    render(<ToggleSwitch checked label="通知" onToggle={() => {}} />);
    expect(screen.getByRole("switch").getAttribute("aria-checked")).toBe(
      "true",
    );
  });

  it("disabled 中はクリックしても発火しない", () => {
    const onToggle = vi.fn();
    render(
      <ToggleSwitch
        checked={false}
        label="通知"
        disabled
        onToggle={onToggle}
      />,
    );
    fireEvent.click(screen.getByRole("switch"));
    expect(onToggle).not.toHaveBeenCalled();
  });
});
