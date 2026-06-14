import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import LiveCommentSettings from "./LiveCommentSettings.tsx";
import { sampleServices } from "../../lib/fixtures.ts";
import { commentSourceLabel } from "../../lib/comment-source.ts";
import { t } from "../../locales/i18n.ts";

const CHANNELS = {
  nicolive: [{
    serviceId: sampleServices[0].id,
    channelId: "ch2646436",
    enabled: true,
  }],
  "nx-jikkyo": [{
    serviceId: sampleServices[0].id,
    channelId: "jk1",
    enabled: true,
  }],
};
const SUGGESTIONS = {
  nicolive: {
    [String(sampleServices[0].id)]: "ch2646436",
    [String(sampleServices[1].id)]: "ch2646437",
  },
  "nx-jikkyo": {
    [String(sampleServices[0].id)]: "jk1",
    [String(sampleServices[1].id)]: "jk2",
  },
};

function setup(
  override: Partial<Parameters<typeof LiveCommentSettings>[0]> = {},
) {
  const props = {
    channels: CHANNELS,
    suggestions: SUGGESTIONS,
    services: sampleServices,
    saving: false,
    onSave: vi.fn(() => Promise.resolve()),
    onBack: vi.fn(),
    ...override,
  };
  return { ...render(<LiveCommentSettings {...props} />), props };
}

const saveButton = () =>
  screen.getByText(t("notification.save")).closest("button")!;
const idInput = () =>
  screen.getByLabelText(t("liveComment.row.inputLabel")) as HTMLInputElement;

describe("LiveCommentSettings template", () => {
  it("初期は nicolive 選択で割り当てを描画し、dirty でない", () => {
    setup();
    expect(idInput().value).toBe("ch2646436");
    expect(saveButton().disabled).toBe(true);
  });

  it("ID を編集すると保存でき、両取得元を含めて送る", async () => {
    const { props } = setup();
    fireEvent.change(idInput(), { target: { value: "ch999" } });
    expect(saveButton().disabled).toBe(false);

    fireEvent.click(saveButton());
    expect(props.onSave).toHaveBeenCalledWith({
      nicolive: [{
        serviceId: sampleServices[0].id,
        channelId: "ch999",
        enabled: true,
      }],
      "nx-jikkyo": [{
        serviceId: sampleServices[0].id,
        channelId: "jk1",
        enabled: true,
      }],
    });
    expect(await screen.findByText(t("liveComment.toast.saved"))).toBeTruthy();
  });

  it("取得元を切り替えると別の割り当てが表示される", () => {
    setup();
    fireEvent.click(screen.getByText(commentSourceLabel("nx-jikkyo")));
    expect(idInput().value).toBe("jk1");
  });

  it("取得元を切り替えてもドラフトを保持する", () => {
    setup();
    fireEvent.change(idInput(), { target: { value: "ch555" } });
    fireEvent.click(screen.getByText(commentSourceLabel("nx-jikkyo")));
    fireEvent.click(screen.getByText(commentSourceLabel("nicolive")));
    expect(idInput().value).toBe("ch555");
  });

  it("不正な形式では保存できない", () => {
    setup();
    fireEvent.change(idInput(), { target: { value: "jk1" } }); // nicolive に jk
    expect(saveButton().disabled).toBe(true);
  });

  it("行を無効化すると検証対象外になり保存できる", () => {
    setup();
    fireEvent.change(idInput(), { target: { value: "bad" } });
    expect(saveButton().disabled).toBe(true);
    // 行を無効化 → その行は検証から外れる
    fireEvent.click(screen.getByLabelText(t("liveComment.row.disable")));
    expect(saveButton().disabled).toBe(false);
  });

  it("設定へ戻るで onBack が発火する", () => {
    const { props } = setup();
    fireEvent.click(screen.getByText(t("liveComment.backToSettings")));
    expect(props.onBack).toHaveBeenCalledTimes(1);
  });
});
