import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import DefaultsButton from "./DefaultsButton.tsx";
import { t } from "../../../locales/i18n.ts";

const regions = [
  { id: "kanto", label: "関東" },
  { id: "kansai", label: "関西" },
];

function setup(override: Partial<Parameters<typeof DefaultsButton>[0]> = {}) {
  const props = {
    regions,
    onApply: vi.fn(),
    ...override,
  };
  return { ...render(<DefaultsButton {...props} />), props };
}

describe("DefaultsButton", () => {
  it("地域が空なら何も描画しない", () => {
    const { container } = setup({ regions: [] });
    expect(container.firstChild).toBeNull();
  });

  it("select とボタンを描画する", () => {
    setup();
    expect(screen.getByText(t("liveComment.defaults.button"))).toBeTruthy();
    expect(
      screen.getByLabelText(t("liveComment.defaults.regionLabel")),
    ).toBeTruthy();
  });

  it("ボタン押下で確認を出し、実行で選択中の地域を onApply に渡す", () => {
    const { props } = setup();
    fireEvent.click(screen.getByText(t("liveComment.defaults.button")));
    expect(screen.getByText(t("liveComment.defaults.confirm"))).toBeTruthy();
    expect(props.onApply).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText(t("liveComment.defaults.apply")));
    expect(props.onApply).toHaveBeenCalledWith("kanto");
  });

  it("地域を変えると onApply にその地域が渡る", () => {
    const { props } = setup();
    fireEvent.change(
      screen.getByLabelText(t("liveComment.defaults.regionLabel")),
      { target: { value: "kansai" } },
    );
    fireEvent.click(screen.getByText(t("liveComment.defaults.button")));
    fireEvent.click(screen.getByText(t("liveComment.defaults.apply")));
    expect(props.onApply).toHaveBeenCalledWith("kansai");
  });

  it("確認はキャンセルで戻せる", () => {
    const { props } = setup();
    fireEvent.click(screen.getByText(t("liveComment.defaults.button")));
    fireEvent.click(screen.getByText(t("liveComment.defaults.cancel")));
    expect(screen.queryByText(t("liveComment.defaults.confirm"))).toBeNull();
    expect(props.onApply).not.toHaveBeenCalled();
  });
});
