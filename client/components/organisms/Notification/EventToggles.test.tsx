import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import EventToggles from "./EventToggles.tsx";
import { NOTIFICATION_EVENT_KEYS } from "../../../../server/lib/notification-settings.ts";
import { t } from "../../../locales/i18n.ts";

const allOn = {
  onSchedule: true,
  onStart: true,
  onEnd: true,
  onFail: true,
  onRemove: true,
};

const allOff = {
  onSchedule: false,
  onStart: false,
  onEnd: false,
  onFail: false,
  onRemove: false,
};

function setup(override: Partial<Parameters<typeof EventToggles>[0]> = {}) {
  const props = {
    values: allOn,
    onToggle: vi.fn(),
    ...override,
  };
  return { ...render(<EventToggles {...props} />), props };
}

describe("EventToggles", () => {
  it("5 イベントの行とトグルを描画する", () => {
    setup();
    for (const key of NOTIFICATION_EVENT_KEYS) {
      const sw = screen.getByRole("switch", {
        name: t(`notification.events.items.${key}.label`),
      });
      expect(sw.getAttribute("aria-checked")).toBe("true");
    }
    expect(screen.getAllByRole("switch").length).toBe(5);
  });

  it("トグルでキー付きの onToggle が発火する", () => {
    const { props } = setup();
    fireEvent.click(
      screen.getByRole("switch", {
        name: t("notification.events.items.onFail.label"),
      }),
    );
    expect(props.onToggle).toHaveBeenCalledWith("onFail");

    fireEvent.click(
      screen.getByRole("switch", {
        name: t("notification.events.items.onSchedule.label"),
      }),
    );
    expect(props.onToggle).toHaveBeenCalledWith("onSchedule");
  });

  it("すべてオフのときだけ案内文を出す", () => {
    setup({ values: allOff });
    expect(screen.getByText(t("notification.events.none"))).toBeTruthy();
  });

  it("どれかオンなら案内文を出さない", () => {
    setup({ values: { ...allOff, onRemove: true } });
    expect(screen.queryByText(t("notification.events.none"))).toBeNull();
  });
});
