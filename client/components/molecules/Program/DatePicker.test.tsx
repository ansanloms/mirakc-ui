import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ProgramDatePicker from "./DatePicker.tsx";
import { formatMdZoned, formatWeekdayZoned } from "../../../lib/datetime.ts";
import { t } from "../../../locales/i18n.ts";

// 固定の「今日」をシステム TZ の ZonedDateTime で決め打ちする（2026-03-09 は月曜）。
const today = Temporal.ZonedDateTime.from(
  `2026-03-09T00:00:00[${Temporal.Now.timeZoneId()}]`,
);

function setup(
  override: Partial<ComponentProps<typeof ProgramDatePicker>> = {},
) {
  const props = {
    targetDate: today,
    onChangeDate: vi.fn(),
    now: today,
    ...override,
  };
  return { ...render(<ProgramDatePicker {...props} />), props };
}

describe("ProgramDatePicker", () => {
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

  it("日付ボタンを押すとドロップダウンが開き「今日」ラベルが現れる", () => {
    setup();
    expect(screen.queryByText(t("program.toolbar.today"))).toBeNull();
    fireEvent.click(screen.getByText(formatMdZoned(today)));
    expect(screen.getByText(t("program.toolbar.today"))).toBeTruthy();
  });

  it("ドロップダウンで別日を選ぶと onChangeDate が発火して閉じる", () => {
    const { props } = setup();
    // トリガー (今日) をクリックして開く。
    fireEvent.click(screen.getByText(formatMdZoned(today)));
    // 翌日のオプション (ドロップダウン内にのみ存在) を選ぶ。
    const tomorrow = today.add({ days: 1 });
    fireEvent.click(screen.getByText(formatMdZoned(tomorrow)));
    expect(props.onChangeDate).toHaveBeenCalledTimes(1);
    // 閉じたので「今日」ラベルは消える。
    expect(screen.queryByText(t("program.toolbar.today"))).toBeNull();
  });
});
