import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MappingFormModal from "./MappingFormModal.tsx";
import type { LiveCommentMapping } from "../../../lib/api/live-comment-settings.ts";
import { sampleChannelGroups } from "../../../lib/fixtures.ts";
import { t } from "../../../locales/i18n.ts";

function setup(override: Partial<Parameters<typeof MappingFormModal>[0]> = {}) {
  const props = {
    open: true,
    channels: sampleChannelGroups,
    takenChannels: [] as string[],
    onSave: vi.fn(),
    onClose: vi.fn(),
    ...override,
  };
  return { ...render(<MappingFormModal {...props} />), props };
}

function saveButton() {
  return screen.getByText(t("liveComment.modal.save")).closest("button")!;
}

function idInputs() {
  return screen.queryAllByLabelText<HTMLInputElement>(
    t("liveComment.modal.idLabel"),
  );
}

function addAssignment() {
  fireEvent.click(screen.getByText(t("liveComment.modal.addAssignment")));
}

function submit(container: HTMLElement) {
  fireEvent.submit(container.querySelector("form")!);
}

describe("MappingFormModal", () => {
  it("新規: チャンネル未選択では保存できない", () => {
    setup();
    expect(screen.getByText(t("liveComment.modal.titleNew"))).toBeTruthy();
    expect(saveButton().disabled).toBe(true);
  });

  it("チャンネルを選べば割り当てが空でも保存できる", () => {
    setup();
    fireEvent.click(screen.getByText("NHK総合"));
    expect(saveButton().disabled).toBe(false);
  });

  it("割り当てを手動で追加して送信する", async () => {
    const { props, container } = setup();
    fireEvent.click(screen.getByText("NHK総合"));
    addAssignment();
    // 追加行の取得元は既定で nicolive。ID を手入力する。
    fireEvent.change(idInputs()[0], { target: { value: " ch2646436 " } });
    submit(container);
    await waitFor(() =>
      expect(props.onSave).toHaveBeenCalledWith({
        channel: "27",
        assignments: [{ source: "nicolive", channelId: "ch2646436" }],
        enabled: true,
      })
    );
  });

  it("ID 形式が不正だと保存できない", () => {
    setup();
    fireEvent.click(screen.getByText("NHK総合"));
    addAssignment();
    // nicolive 行に jk 形式を入れる
    fireEvent.change(idInputs()[0], { target: { value: "jk999" } });
    expect(saveButton().disabled).toBe(true);
  });

  it("設定済みチャンネルは選択不可", () => {
    setup({ takenChannels: ["26"] });
    const taken = screen.getByText("Eテレ").closest("button")!;
    expect(taken.disabled).toBe(true);
  });

  it("割り当てを追加・削除できる", () => {
    setup();
    fireEvent.click(screen.getByText("NHK総合"));
    expect(idInputs()).toHaveLength(0);
    addAssignment();
    expect(idInputs()).toHaveLength(1);
    addAssignment();
    expect(idInputs()).toHaveLength(2);
    fireEvent.click(
      screen.getAllByLabelText(t("liveComment.modal.removeAssignment"))[1],
    );
    expect(idInputs()).toHaveLength(1);
  });

  it("編集: 既存値をプリフィルし enabled を維持する", async () => {
    const initial: LiveCommentMapping = {
      id: "a",
      channel: "27",
      assignments: [{ source: "nx-jikkyo", channelId: "jk1" }],
      enabled: false,
      createdAt: 0,
    };
    const { props, container } = setup({ initial });
    expect(screen.getByText(t("liveComment.modal.titleEdit"))).toBeTruthy();
    expect(idInputs()[0].value).toBe("jk1");
    expect(screen.getByText(t("liveComment.modal.saveEdit"))).toBeTruthy();

    submit(container);
    await waitFor(() =>
      expect(props.onSave).toHaveBeenCalledWith({
        channel: "27",
        assignments: [{ source: "nx-jikkyo", channelId: "jk1" }],
        enabled: false,
      })
    );
  });

  it("キャンセルで onClose が発火する", () => {
    const { props } = setup();
    fireEvent.click(screen.getByText(t("liveComment.modal.cancel")));
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
