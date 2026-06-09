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
  it("日付ナビ・band タブ・検索トリガを内包する", () => {
    setup();
    // DatePicker
    expect(screen.getByLabelText(t("program.toolbar.prevDay"))).toBeTruthy();
    expect(screen.getByLabelText(t("program.toolbar.nextDay"))).toBeTruthy();
    // BandTabs
    for (const b of BANDS) {
      expect(screen.getByText(b.label)).toBeTruthy();
    }
    // SearchTrigger
    expect(screen.getByText(t("program.toolbar.search"))).toBeTruthy();
  });

  it("子コンポーネントのコールバックを props へ繋いでいる", () => {
    const { props } = setup();
    fireEvent.click(screen.getByText(t("program.toolbar.search")));
    expect(props.onOpenSearch).toHaveBeenCalledTimes(1);
    const bs = BANDS.find((b) => b.id === "BS")!;
    fireEvent.click(screen.getByText(bs.label));
    expect(props.onChangeBand).toHaveBeenCalledWith("BS");
  });
});
