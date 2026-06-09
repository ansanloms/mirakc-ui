import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ProgramToolbar from "./Toolbar.tsx";
import { BANDS } from "../../../lib/service.ts";
import { t } from "../../../locales/i18n.ts";

const today = Temporal.ZonedDateTime.from(
  `2026-03-09T00:00:00[${Temporal.Now.timeZoneId()}]`,
);

function setup(
  override: Partial<ComponentProps<typeof ProgramToolbar>> = {},
) {
  const props = {
    targetDate: today,
    onChangeDate: vi.fn(),
    band: "GR" as const,
    onChangeBand: vi.fn(),
    onOpenSearch: vi.fn(),
    now: today,
    ...override,
  };
  return { ...render(<ProgramToolbar {...props} />), props };
}

describe("ProgramToolbar", () => {
  it("band タブのクリックで onChangeBand が発火する", () => {
    const { props } = setup();
    // GR 以外 (BS) のタブを押す。
    const bs = BANDS.find((b) => b.id === "BS")!;
    fireEvent.click(screen.getByText(bs.label));
    expect(props.onChangeBand).toHaveBeenCalledTimes(1);
    expect(props.onChangeBand).toHaveBeenCalledWith("BS");
  });

  it("検索トリガで onOpenSearch が発火する", () => {
    const { props } = setup();
    fireEvent.click(screen.getByText(t("program.toolbar.search")));
    expect(props.onOpenSearch).toHaveBeenCalledTimes(1);
  });

  it("日付ナビゲーション (DatePicker) を内包する", () => {
    setup();
    expect(screen.getByLabelText(t("program.toolbar.prevDay"))).toBeTruthy();
    expect(screen.getByLabelText(t("program.toolbar.nextDay"))).toBeTruthy();
  });
});
