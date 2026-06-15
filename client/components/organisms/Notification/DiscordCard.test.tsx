import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import DiscordCard from "./DiscordCard.tsx";
import { t } from "../../../locales/i18n.ts";

function setup(override: Partial<Parameters<typeof DiscordCard>[0]> = {}) {
  const props = {
    webhookUrl: "",
    testEnabled: false,
    testing: false,
    onChangeWebhookUrl: vi.fn(),
    onTest: vi.fn(),
    ...override,
  };
  return { ...render(<DiscordCard {...props} />), props };
}

function urlInput() {
  return screen.getByPlaceholderText<HTMLInputElement>(
    t("notification.discord.urlPlaceholder"),
  );
}

describe("DiscordCard", () => {
  it("Webhook URL の入力が onChange に伝わる", () => {
    const { props } = setup();
    fireEvent.change(urlInput(), {
      target: { value: "https://discord.com/api/webhooks/1/tok" },
    });
    expect(props.onChangeWebhookUrl).toHaveBeenCalledWith(
      "https://discord.com/api/webhooks/1/tok",
    );
  });

  it("エラー文言を出し分ける (不正 URL / URL 必須 / ヒント)", () => {
    const invalid = setup({ urlError: "invalid" });
    expect(
      screen.getByText(t("notification.discord.urlInvalid")),
    ).toBeTruthy();
    invalid.unmount();

    const required = setup({ urlError: "required" });
    expect(
      screen.getByText(t("notification.discord.urlRequired")),
    ).toBeTruthy();
    required.unmount();

    setup();
    expect(screen.getByText(t("notification.discord.urlHint"))).toBeTruthy();
  });

  it("テストボタンは testEnabled でのみ活性、クリックで onTest", () => {
    const { props } = setup({ testEnabled: true });
    const button = screen.getByText(t("notification.discord.test"))
      .closest("button")!;
    expect(button.disabled).toBe(false);

    fireEvent.click(button);
    expect(props.onTest).toHaveBeenCalledTimes(1);
  });

  it("testEnabled=false / testing 中はテストボタンが無効", () => {
    const first = setup();
    expect(
      screen.getByText(t("notification.discord.test")).closest("button")!
        .disabled,
    ).toBe(true);
    first.unmount();

    setup({ testEnabled: true, testing: true });
    expect(
      screen.getByText(t("notification.discord.test")).closest("button")!
        .disabled,
    ).toBe(true);
  });
});
