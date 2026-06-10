import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import SaveBar from "./SaveBar.tsx";
import { t } from "../../../locales/i18n.ts";

function setup(override: Partial<Parameters<typeof SaveBar>[0]> = {}) {
  const props = {
    dirty: true,
    saving: false,
    disabled: false,
    onSave: vi.fn(),
    ...override,
  };
  return { ...render(<SaveBar {...props} />), props };
}

function saveButton() {
  return screen.getByText(t("notification.save")).closest("button")!;
}

describe("SaveBar", () => {
  it("dirty なら未保存ピルを出し保存できる", () => {
    const { props } = setup();
    expect(screen.getByText(t("notification.dirty"))).toBeTruthy();
    expect(saveButton().disabled).toBe(false);

    fireEvent.click(saveButton());
    expect(props.onSave).toHaveBeenCalledTimes(1);
  });

  it("dirty でなければピルを出さず保存も無効", () => {
    setup({ dirty: false });
    expect(screen.queryByText(t("notification.dirty"))).toBeNull();
    expect(saveButton().disabled).toBe(true);
  });

  it("saving / disabled 中は保存ボタンが無効", () => {
    const saving = setup({ saving: true });
    expect(saveButton().disabled).toBe(true);
    saving.unmount();

    setup({ disabled: true });
    expect(saveButton().disabled).toBe(true);
  });
});
