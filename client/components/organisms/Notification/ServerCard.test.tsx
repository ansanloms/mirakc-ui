import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ServerCard from "./ServerCard.tsx";
import { t } from "../../../locales/i18n.ts";

function setup(override: Partial<Parameters<typeof ServerCard>[0]> = {}) {
  const props = {
    url: "",
    token: "",
    testEnabled: false,
    testing: false,
    onChangeUrl: vi.fn(),
    onChangeToken: vi.fn(),
    onTest: vi.fn(),
    ...override,
  };
  return { ...render(<ServerCard {...props} />), props };
}

function urlInput() {
  return screen.getByPlaceholderText<HTMLInputElement>(
    t("notification.server.urlPlaceholder"),
  );
}

function tokenInput() {
  return screen.getByPlaceholderText<HTMLInputElement>(
    t("notification.server.tokenPlaceholder"),
  );
}

describe("ServerCard", () => {
  it("URL / TOKEN の入力が onChange に伝わる", () => {
    const { props } = setup();
    fireEvent.change(urlInput(), {
      target: { value: "https://ntfy.sh/x" },
    });
    expect(props.onChangeUrl).toHaveBeenCalledWith("https://ntfy.sh/x");

    fireEvent.change(tokenInput(), { target: { value: "tk" } });
    expect(props.onChangeToken).toHaveBeenCalledWith("tk");
  });

  it("エラー文言を出し分ける (不正 URL / URL 必須 / ヒント)", () => {
    const invalid = setup({ urlError: "invalid" });
    expect(
      screen.getByText(t("notification.server.urlInvalid")),
    ).toBeTruthy();
    invalid.unmount();

    const required = setup({ urlError: "required" });
    expect(
      screen.getByText(t("notification.server.urlRequired")),
    ).toBeTruthy();
    required.unmount();

    setup();
    expect(screen.getByText(t("notification.server.urlHint"))).toBeTruthy();
  });

  it("TOKEN は password 入力で、目アイコンで表示を切り替える", () => {
    setup();
    expect(tokenInput().type).toBe("password");

    fireEvent.click(
      screen.getByLabelText(t("notification.server.showToken")),
    );
    expect(tokenInput().type).toBe("text");

    fireEvent.click(
      screen.getByLabelText(t("notification.server.hideToken")),
    );
    expect(tokenInput().type).toBe("password");
  });

  it("テストボタンは testEnabled でのみ活性、クリックで onTest", () => {
    const { props } = setup({ testEnabled: true });
    const button = screen.getByText(t("notification.server.test"))
      .closest("button")!;
    expect(button.disabled).toBe(false);

    fireEvent.click(button);
    expect(props.onTest).toHaveBeenCalledTimes(1);
  });

  it("testEnabled=false / testing 中はテストボタンが無効", () => {
    const first = setup();
    expect(
      screen.getByText(t("notification.server.test")).closest("button")!
        .disabled,
    ).toBe(true);
    first.unmount();

    setup({ testEnabled: true, testing: true });
    expect(
      screen.getByText(t("notification.server.test")).closest("button")!
        .disabled,
    ).toBe(true);
  });
});
