import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ChannelMapCard, { type MappingRow } from "./ChannelMapCard.tsx";
import { sampleServices } from "../../../lib/fixtures.ts";
import { t } from "../../../locales/i18n.ts";
import type { LiveCommentSourceId } from "../../../../server/lib/live-comment-settings.ts";

function setup(
  source: LiveCommentSourceId,
  rows: MappingRow[],
  override: Partial<Parameters<typeof ChannelMapCard>[0]> = {},
) {
  const props = {
    source,
    rows,
    services: sampleServices,
    duplicateIds: new Set<string>(),
    invalidCount: 0,
    onChangeRow: vi.fn(),
    onAddRow: vi.fn(),
    onRemoveRow: vi.fn(),
    ...override,
  };
  return { ...render(<ChannelMapCard {...props} />), props };
}

const row = (
  key: number,
  serviceId: number | null,
  channelId: string,
  enabled = true,
): MappingRow => ({ key, serviceId, channelId, enabled });

describe("ChannelMapCard", () => {
  it("行が無ければ空状態の案内を出す", () => {
    setup("nicolive", []);
    expect(screen.getByText(t("liveComment.empty"))).toBeTruthy();
  });

  it("行のチャンネル選択と ID 入力を描画する", () => {
    setup("nicolive", [row(1, sampleServices[0].id, "ch2646436")]);
    const select = screen.getByLabelText(
      t("liveComment.row.selectLabel"),
    ) as HTMLSelectElement;
    expect(select.value).toBe(String(sampleServices[0].id));
    const input = screen.getByLabelText(
      t("liveComment.row.inputLabel"),
    ) as HTMLInputElement;
    expect(input.value).toBe("ch2646436");
  });

  it("placeholder は取得元で切り替わる", () => {
    setup("nx-jikkyo", [row(1, sampleServices[0].id, "")]);
    const input = screen.getByLabelText(
      t("liveComment.row.inputLabel"),
    ) as HTMLInputElement;
    expect(input.placeholder).toBe(t("liveComment.row.placeholder.nx-jikkyo"));
  });

  it("ID の変更が onChangeRow に届く", () => {
    const { props } = setup("nicolive", [row(1, sampleServices[0].id, "")]);
    fireEvent.change(screen.getByLabelText(t("liveComment.row.inputLabel")), {
      target: { value: "ch99" },
    });
    expect(props.onChangeRow).toHaveBeenCalledWith(1, { channelId: "ch99" });
  });

  it("有効スイッチで enabled が切り替わる", () => {
    const { props } = setup("nicolive", [
      row(1, sampleServices[0].id, "ch1", true),
    ]);
    fireEvent.click(screen.getByLabelText(t("liveComment.row.disable")));
    expect(props.onChangeRow).toHaveBeenCalledWith(1, { enabled: false });
  });

  it("行の削除と末尾追加ボタン", () => {
    const { props } = setup("nicolive", [row(1, null, "")]);
    fireEvent.click(screen.getByLabelText(t("liveComment.row.remove")));
    expect(props.onRemoveRow).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByText(t("liveComment.addRow")));
    expect(props.onAddRow).toHaveBeenCalledTimes(1);
  });

  it("形式エラー・重複エラーのメッセージを出す", () => {
    setup("nicolive", [
      row(1, sampleServices[0].id, "bad"),
      row(2, sampleServices[1].id, "ch1"),
      row(3, sampleServices[2].id, "ch1"),
    ], { invalidCount: 1, duplicateIds: new Set(["ch1"]) });
    expect(
      screen.getByText(
        t("liveComment.error.format", {
          format: t("liveComment.format.nicolive"),
          count: 1,
        }),
      ),
    ).toBeTruthy();
    expect(
      screen.getByText(t("liveComment.error.duplicate", { ids: "ch1" })),
    ).toBeTruthy();
  });
});
