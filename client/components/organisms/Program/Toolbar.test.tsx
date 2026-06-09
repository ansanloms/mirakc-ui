import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ProgramToolbar from "./Toolbar.tsx";
import { BANDS } from "../../../lib/service.ts";
import { formatMdZoned, formatWeekdayZoned } from "../../../lib/datetime.ts";
import { t } from "../../../locales/i18n.ts";

// 固定の「今日」をシステム TZ の ZonedDateTime で決め打ちする（2026-03-09 は月曜）。
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
  it("現在 (targetDate) の日付を表示する", () => {
    setup();
    expect(screen.getByText(formatMdZoned(today))).toBeTruthy();
    expect(screen.getByText(`(${formatWeekdayZoned(today)})`)).toBeTruthy();
  });

  it("targetDate が今日なら前の日ボタンが disabled", () => {
    setup();
    const prev = screen.getByLabelText(t("program.toolbar.prevDay"));
    expect((prev as HTMLButtonElement).disabled).toBe(true);
  });

  it("targetDate が今日でなければ前の日ボタンは押せて onChangeDate が発火する", () => {
    const tomorrow = today.add({ days: 1 });
    const { props } = setup({ targetDate: tomorrow });
    const prev = screen.getByLabelText(t("program.toolbar.prevDay"));
    expect((prev as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(prev);
    expect(props.onChangeDate).toHaveBeenCalledTimes(1);
  });

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

  it("日付ボタンを押すとドロップダウンが開き「今日」ラベルが現れる", () => {
    setup();
    // 初期状態ではドロップダウンの「今日」ラベルは出ていない。
    expect(screen.queryByText(t("program.toolbar.today"))).toBeNull();
    // 現在日付表示ボタン (M/d) をクリックして開く。
    fireEvent.click(screen.getByText(formatMdZoned(today)));
    expect(screen.getByText(t("program.toolbar.today"))).toBeTruthy();
  });
});
