import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MappingFormModal from "./MappingFormModal.tsx";
import type {
  LiveCommentMapping,
  LiveCommentSuggestion,
} from "../../../lib/api/live-comment-settings.ts";
import { sampleChannelGroups } from "../../../lib/fixtures.ts";
import { t } from "../../../locales/i18n.ts";

const suggestions: LiveCommentSuggestion[] = [
  {
    channel: "27",
    assignments: [
      { source: "nicolive", channelId: "ch2646436" },
      { source: "nx-jikkyo", channelId: "jk1" },
    ],
  },
];

function setup(override: Partial<Parameters<typeof MappingFormModal>[0]> = {}) {
  const props = {
    open: true,
    channels: sampleChannelGroups,
    suggestions,
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
  return screen.getAllByLabelText<HTMLInputElement>(
    t("liveComment.modal.idLabel"),
  );
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

  it("チャンネルを選ぶと候補を自動入力し保存できる", () => {
    setup();
    fireEvent.click(screen.getByText("NHK総合"));
    const values = idInputs().map((input) => input.value);
    expect(values).toContain("ch2646436");
    expect(values).toContain("jk1");
    expect(saveButton().disabled).toBe(false);
  });

  it("送信で正規化済みの入力を onSave に渡す", async () => {
    const { props, container } = setup();
    fireEvent.click(screen.getByText("NHK総合"));
    submit(container);
    await waitFor(() =>
      expect(props.onSave).toHaveBeenCalledWith({
        channel: "27",
        assignments: [
          { source: "nicolive", channelId: "ch2646436" },
          { source: "nx-jikkyo", channelId: "jk1" },
        ],
        enabled: true,
      })
    );
  });

  it("ID 形式が不正だと保存できない", () => {
    setup();
    fireEvent.click(screen.getByText("NHK総合"));
    // nicolive の行 (ch2646436) を jk 形式に書き換える
    const input = idInputs().find((i) => i.value === "ch2646436")!;
    fireEvent.change(input, { target: { value: "jk999" } });
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
    expect(idInputs()).toHaveLength(2);
    fireEvent.click(screen.getByText(t("liveComment.modal.addAssignment")));
    expect(idInputs()).toHaveLength(3);
    fireEvent.click(
      screen.getAllByLabelText(t("liveComment.modal.removeAssignment"))[2],
    );
    expect(idInputs()).toHaveLength(2);
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
