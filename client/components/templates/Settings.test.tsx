import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import Settings from "./Settings.tsx";
import { t } from "../../locales/i18n.ts";

function setup(override: Partial<Parameters<typeof Settings>[0]> = {}) {
  const props = {
    onOpenKeywords: vi.fn(),
    onOpenNotification: vi.fn(),
    onOpenLiveComments: vi.fn(),
    onBack: vi.fn(),
    ...override,
  };
  return { ...render(<Settings {...props} />), props };
}

describe("Settings template", () => {
  it("タイトル・リード文・キーワード自動録画のカードを描画する", () => {
    setup();
    expect(screen.getAllByText(t("settings.title")).length).toBeGreaterThan(0);
    expect(screen.getByText(t("settings.lead"))).toBeTruthy();
    expect(screen.getByText(t("keyword.title"))).toBeTruthy();
    expect(
      screen.getByText(t("settings.cards.keyword.description")),
    ).toBeTruthy();
  });

  it("キーワード自動録画のカードで onOpenKeywords が発火する", () => {
    const { props } = setup();
    fireEvent.click(screen.getByText(t("keyword.title")));
    expect(props.onOpenKeywords).toHaveBeenCalledTimes(1);
  });

  it("通知設定のカードで onOpenNotification が発火する", () => {
    const { props } = setup();
    expect(
      screen.getByText(t("settings.cards.notification.description")),
    ).toBeTruthy();
    fireEvent.click(screen.getByText(t("notification.title")));
    expect(props.onOpenNotification).toHaveBeenCalledTimes(1);
  });

  it("実況連携のカードで onOpenLiveComments が発火する", () => {
    const { props } = setup();
    expect(
      screen.getByText(t("settings.cards.liveComment.description")),
    ).toBeTruthy();
    fireEvent.click(screen.getByText(t("liveComment.title")));
    expect(props.onOpenLiveComments).toHaveBeenCalledTimes(1);
  });

  it("番組表へ戻るリンクで onBack が発火する", () => {
    const { props } = setup();
    fireEvent.click(screen.getByText(t("settings.epg")));
    expect(props.onBack).toHaveBeenCalledTimes(1);
  });
});
