import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import EventToggles from "./EventToggles.tsx";
import { t } from "../../../locales/i18n.ts";

function setup(override: Partial<Parameters<typeof EventToggles>[0]> = {}) {
  const props = {
    onStart: true,
    onEnd: true,
    onToggleStart: vi.fn(),
    onToggleEnd: vi.fn(),
    ...override,
  };
  return { ...render(<EventToggles {...props} />), props };
}

describe("EventToggles", () => {
  it("録画開始・終了の行とトグルを描画する", () => {
    setup();
    expect(screen.getByText(t("notification.events.start"))).toBeTruthy();
    expect(screen.getByText(t("notification.events.end"))).toBeTruthy();

    const start = screen.getByRole("switch", {
      name: t("notification.events.start"),
    });
    expect(start.getAttribute("aria-checked")).toBe("true");
  });

  it("トグルでコールバックが発火する", () => {
    const { props } = setup();
    fireEvent.click(
      screen.getByRole("switch", { name: t("notification.events.start") }),
    );
    expect(props.onToggleStart).toHaveBeenCalledTimes(1);

    fireEvent.click(
      screen.getByRole("switch", { name: t("notification.events.end") }),
    );
    expect(props.onToggleEnd).toHaveBeenCalledTimes(1);
  });

  it("両方オフのときだけ案内文を出す", () => {
    setup({ onStart: false, onEnd: false });
    expect(screen.getByText(t("notification.events.none"))).toBeTruthy();
  });

  it("どちらかオンなら案内文を出さない", () => {
    setup({ onStart: true, onEnd: false });
    expect(screen.queryByText(t("notification.events.none"))).toBeNull();
  });
});
