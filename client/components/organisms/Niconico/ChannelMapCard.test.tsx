import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ChannelMapCard, { type MappingRow } from "./ChannelMapCard.tsx";
import { sampleServices } from "../../../lib/fixtures.ts";
import { t } from "../../../locales/i18n.ts";

function setup(
  rows: MappingRow[],
  override: Partial<Parameters<typeof ChannelMapCard>[0]> = {},
) {
  const props = {
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
  nicoliveChannelId: string,
): MappingRow => ({ key, serviceId, nicoliveChannelId });

describe("ChannelMapCard", () => {
  it("行が無ければ空状態の案内を出す", () => {
    setup([]);
    expect(screen.getByText(t("niconico.empty"))).toBeTruthy();
  });

  it("行のチャンネル選択と ID 入力を描画する", () => {
    setup([row(1, sampleServices[0].id, "ch2646436")]);
    const select = screen.getByLabelText(
      t("niconico.row.selectLabel"),
    ) as HTMLSelectElement;
    expect(select.value).toBe(String(sampleServices[0].id));
    const input = screen.getByLabelText(
      t("niconico.row.inputLabel"),
    ) as HTMLInputElement;
    expect(input.value).toBe("ch2646436");
  });

  it("他の行で選択済みのチャンネルは選択肢が無効になる", () => {
    setup([
      row(1, sampleServices[0].id, "ch1"),
      row(2, null, ""),
    ]);
    const selects = screen.getAllByLabelText(t("niconico.row.selectLabel"));
    const second = selects[1] as HTMLSelectElement;
    const option = [...second.options].find(
      (o) => o.value === String(sampleServices[0].id),
    );
    expect(option?.disabled).toBe(true);
  });

  it("ID の変更が onChangeRow に届く", () => {
    const { props } = setup([row(1, sampleServices[0].id, "")]);
    fireEvent.change(screen.getByLabelText(t("niconico.row.inputLabel")), {
      target: { value: "ch99" },
    });
    expect(props.onChangeRow).toHaveBeenCalledWith(1, {
      nicoliveChannelId: "ch99",
    });
  });

  it("チャンネル選択の変更が serviceId (number) で届く", () => {
    const { props } = setup([row(1, null, "")]);
    fireEvent.change(screen.getByLabelText(t("niconico.row.selectLabel")), {
      target: { value: String(sampleServices[1].id) },
    });
    expect(props.onChangeRow).toHaveBeenCalledWith(1, {
      serviceId: sampleServices[1].id,
    });
  });

  it("行の追加・削除と末尾追加ボタン", () => {
    const { props } = setup([row(1, null, "")]);
    fireEvent.click(screen.getByLabelText(t("niconico.row.add")));
    expect(props.onAddRow).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByLabelText(t("niconico.row.remove")));
    expect(props.onRemoveRow).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByText(t("niconico.addRow")));
    expect(props.onAddRow).toHaveBeenCalledWith(null);
  });

  it("形式エラー・重複エラーのメッセージを出す", () => {
    setup([
      row(1, sampleServices[0].id, "bad"),
      row(2, sampleServices[1].id, "ch1"),
      row(3, sampleServices[2].id, "ch1"),
    ], { invalidCount: 1, duplicateIds: new Set(["ch1"]) });
    expect(
      screen.getByText(t("niconico.error.format", { count: 1 })),
    ).toBeTruthy();
    expect(
      screen.getByText(t("niconico.error.duplicate", { ids: "ch1" })),
    ).toBeTruthy();
  });
});
