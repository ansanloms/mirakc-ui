import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import Niconico from "./Niconico.tsx";
import { sampleServices } from "../../lib/fixtures.ts";
import { t } from "../../locales/i18n.ts";

const CHANNELS = [
  { serviceId: sampleServices[0].id, nicoliveChannelId: "ch2646436" },
];
const SUGGESTIONS = {
  [String(sampleServices[0].id)]: "ch2646436",
  [String(sampleServices[1].id)]: "ch2646437",
};

function setup(override: Partial<Parameters<typeof Niconico>[0]> = {}) {
  const props = {
    channels: CHANNELS,
    suggestions: SUGGESTIONS,
    services: sampleServices,
    saving: false,
    onSave: vi.fn(() => Promise.resolve()),
    onBack: vi.fn(),
    ...override,
  };
  return { ...render(<Niconico {...props} />), props };
}

const saveButton = () =>
  screen.getByText(t("notification.save")).closest("button")!;

describe("Niconico template", () => {
  it("保存済みの割り当てを行として描画し、初期状態は dirty でない", () => {
    setup();
    const input = screen.getByLabelText(
      t("niconico.row.inputLabel"),
    ) as HTMLInputElement;
    expect(input.value).toBe("ch2646436");
    expect(saveButton().disabled).toBe(true);
    expect(screen.queryByText(t("notification.dirty"))).toBeNull();
  });

  it("ID を編集すると dirty になり保存できる", async () => {
    const { props } = setup();
    fireEvent.change(screen.getByLabelText(t("niconico.row.inputLabel")), {
      target: { value: "ch999" },
    });
    expect(screen.getByText(t("notification.dirty"))).toBeTruthy();
    expect(saveButton().disabled).toBe(false);

    fireEvent.click(saveButton());
    expect(props.onSave).toHaveBeenCalledWith({
      channels: [{
        serviceId: sampleServices[0].id,
        nicoliveChannelId: "ch999",
      }],
    });
    // toast (保存しました) が出る
    expect(await screen.findByText(t("niconico.toast.saved"))).toBeTruthy();
  });

  it("チャンネルを選ぶと既知の ID が自動補完される", () => {
    setup();
    fireEvent.click(screen.getByText(t("niconico.addRow")));
    const selects = screen.getAllByLabelText(t("niconico.row.selectLabel"));
    fireEvent.change(selects[1], {
      target: { value: String(sampleServices[1].id) },
    });
    const inputs = screen.getAllByLabelText(
      t("niconico.row.inputLabel"),
    ) as HTMLInputElement[];
    expect(inputs[1].value).toBe("ch2646437");
  });

  it("不正な形式では保存できずエラーを出す", () => {
    setup();
    fireEvent.change(screen.getByLabelText(t("niconico.row.inputLabel")), {
      target: { value: "jk1" },
    });
    expect(
      screen.getByText(t("niconico.error.format", { count: 1 })),
    ).toBeTruthy();
    expect(saveButton().disabled).toBe(true);
  });

  it("重複した ID では保存できずエラーを出す", () => {
    setup();
    // 2 行目を追加して同じ ID を割り当てる
    fireEvent.click(screen.getByText(t("niconico.addRow")));
    const selects = screen.getAllByLabelText(t("niconico.row.selectLabel"));
    fireEvent.change(selects[1], {
      target: { value: String(sampleServices[1].id) },
    });
    const inputs = screen.getAllByLabelText(t("niconico.row.inputLabel"));
    fireEvent.change(inputs[1], { target: { value: "ch2646436" } });
    expect(
      screen.getByText(t("niconico.error.duplicate", { ids: "ch2646436" })),
    ).toBeTruthy();
    expect(saveButton().disabled).toBe(true);
  });

  it("行を削除すると割り当てから消える", () => {
    setup();
    fireEvent.click(screen.getByLabelText(t("niconico.row.remove")));
    expect(screen.getByText(t("niconico.empty"))).toBeTruthy();
    expect(screen.getByText(t("notification.dirty"))).toBeTruthy();
  });

  it("設定へ戻るで onBack が発火する", () => {
    const { props } = setup();
    fireEvent.click(screen.getByText(t("niconico.backToSettings")));
    expect(props.onBack).toHaveBeenCalledTimes(1);
  });
});
