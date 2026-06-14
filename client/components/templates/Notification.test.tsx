import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import Notification from "./Notification.tsx";
import { DEFAULT_NOTIFICATION_SETTINGS } from "../../../server/lib/notification-settings.ts";
import { t } from "../../locales/i18n.ts";

function setup(override: Partial<Parameters<typeof Notification>[0]> = {}) {
  const props = {
    settings: DEFAULT_NOTIFICATION_SETTINGS,
    saving: false,
    testing: false,
    onSave: vi.fn(() => Promise.resolve()),
    onTest: vi.fn(() => Promise.resolve()),
    onBackToSettings: vi.fn(),
    onOpenWatch: vi.fn(),
    onBack: vi.fn(),
    ...override,
  };
  return { ...render(<Notification {...props} />), props };
}

function urlInput() {
  return screen.getByPlaceholderText<HTMLInputElement>(
    t("notification.server.urlPlaceholder"),
  );
}

function saveButton() {
  return screen.getByText(t("notification.save")).closest("button")!;
}

describe("Notification template", () => {
  it("タイトル・リード文・2 カードを描画する", () => {
    setup();
    expect(screen.getAllByText(t("notification.title")).length)
      .toBeGreaterThan(0);
    expect(screen.getByText(t("notification.lead"))).toBeTruthy();
    expect(screen.getByText(t("notification.server.title"))).toBeTruthy();
    expect(screen.getByText(t("notification.events.title"))).toBeTruthy();
  });

  it("変更が無ければ保存不可、変更で dirty ピルが出る", () => {
    setup();
    expect(saveButton().disabled).toBe(true);
    expect(screen.queryByText(t("notification.dirty"))).toBeNull();

    fireEvent.change(urlInput(), {
      target: { value: "https://ntfy.sh/mirakc" },
    });
    expect(screen.getByText(t("notification.dirty"))).toBeTruthy();
    expect(saveButton().disabled).toBe(false);
  });

  it("不正な URL はエラーを出し保存できない", () => {
    setup();
    fireEvent.change(urlInput(), { target: { value: "not a url" } });
    expect(
      screen.getByText(t("notification.server.urlInvalid")),
    ).toBeTruthy();
    expect(saveButton().disabled).toBe(true);
  });

  it("イベント有効で URL 空なら必須エラーで保存できない", () => {
    setup();
    fireEvent.click(
      screen.getByRole("switch", {
        name: t("notification.events.items.onStart.label"),
      }),
    );
    expect(
      screen.getByText(t("notification.server.urlRequired")),
    ).toBeTruthy();
    expect(saveButton().disabled).toBe(true);
  });

  it("新イベント (録画失敗) のトグルだけでも URL 必須になる", () => {
    setup();
    fireEvent.click(
      screen.getByRole("switch", {
        name: t("notification.events.items.onFail.label"),
      }),
    );
    expect(
      screen.getByText(t("notification.server.urlRequired")),
    ).toBeTruthy();
  });

  it("保存成功で onSave に trim 済みの値が渡りトーストが出る", async () => {
    const { props } = setup();
    fireEvent.change(urlInput(), {
      target: { value: " https://ntfy.sh/mirakc " },
    });
    fireEvent.click(saveButton());

    // form.handleSubmit は非同期。トースト表示を待てば onSave は呼び出し済み。
    expect(await screen.findByText(t("notification.toast.saved")))
      .toBeTruthy();
    expect(props.onSave).toHaveBeenCalledWith({
      ...DEFAULT_NOTIFICATION_SETTINGS,
      url: "https://ntfy.sh/mirakc",
    });
  });

  it("保存失敗で失敗トーストが出る", async () => {
    setup({ onSave: vi.fn(() => Promise.reject(new Error("ng"))) });
    fireEvent.change(urlInput(), {
      target: { value: "https://ntfy.sh/mirakc" },
    });
    fireEvent.click(saveButton());
    expect(await screen.findByText(t("notification.toast.saveFailed")))
      .toBeTruthy();
  });

  it("テスト送信が onTest に渡り成功トーストが出る", async () => {
    const { props } = setup({
      settings: {
        ...DEFAULT_NOTIFICATION_SETTINGS,
        url: "https://ntfy.sh/mirakc",
        token: "tk",
        onStart: true,
        onEnd: true,
      },
    });
    fireEvent.click(
      screen.getByText(t("notification.server.test")).closest("button")!,
    );
    expect(props.onTest).toHaveBeenCalledWith({
      url: "https://ntfy.sh/mirakc",
      token: "tk",
    });
    expect(await screen.findByText(t("notification.toast.testSent")))
      .toBeTruthy();
  });

  it("番組表へ戻るリンクで onBack が発火する", () => {
    const { props } = setup();
    fireEvent.click(screen.getByLabelText(t("notification.epg")));
    expect(props.onBack).toHaveBeenCalledTimes(1);
  });

  it("設定へ戻るリンクで onBackToSettings が発火する", () => {
    const { props } = setup();
    fireEvent.click(screen.getByLabelText(t("notification.settings")));
    expect(props.onBackToSettings).toHaveBeenCalledTimes(1);
  });

  it("視聴画面へのリンクで onOpenWatch が発火する", () => {
    const { props } = setup();
    fireEvent.click(screen.getByLabelText(t("watch.open")));
    expect(props.onOpenWatch).toHaveBeenCalledTimes(1);
  });
});
