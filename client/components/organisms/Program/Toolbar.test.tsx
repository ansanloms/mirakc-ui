import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ProgramToolbar from "./Toolbar.tsx";
import { CHANNEL_TYPES, channelTypeLabel } from "../../../lib/service.ts";
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
    channelType: "GR" as const,
    onChangeChannelType: vi.fn(),
    onOpenSearch: vi.fn(),
    onOpenSettings: vi.fn(),
    now: today,
    ...override,
  };
  return { ...render(<ProgramToolbar {...props} />), props };
}

describe("ProgramToolbar", () => {
  it("日付ナビ・channel type タブ・検索トリガを内包する", () => {
    setup();
    // DatePicker
    expect(screen.getByLabelText(t("program.toolbar.prevDay"))).toBeTruthy();
    expect(screen.getByLabelText(t("program.toolbar.nextDay"))).toBeTruthy();
    // ChannelTypeTabList
    for (const id of CHANNEL_TYPES) {
      expect(screen.getByText(channelTypeLabel(id))).toBeTruthy();
    }
    // SearchTrigger
    expect(screen.getByText(t("program.toolbar.search"))).toBeTruthy();
    // 設定ポータルへの歯車
    expect(screen.getByLabelText(t("settings.open"))).toBeTruthy();
  });

  it("子コンポーネントのコールバックを props へ繋いでいる", () => {
    const { props } = setup();
    fireEvent.click(screen.getByText(t("program.toolbar.search")));
    expect(props.onOpenSearch).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText(channelTypeLabel("BS")));
    expect(props.onChangeChannelType).toHaveBeenCalledWith("BS");
    fireEvent.click(screen.getByLabelText(t("settings.open")));
    expect(props.onOpenSettings).toHaveBeenCalledTimes(1);
  });
});
