import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ProgramSearchModal from "./SearchModal.tsx";
import { t } from "../../../locales/i18n.ts";
import {
  samplePrograms,
  sampleSchedules,
  sampleServices,
} from "../../../lib/fixtures.ts";

function setup(
  overrides: Partial<Parameters<typeof ProgramSearchModal>[0]> = {},
) {
  const onClose = vi.fn();
  const onPick = vi.fn();
  const result = render(
    <ProgramSearchModal
      open
      onClose={onClose}
      programs={samplePrograms}
      services={sampleServices}
      schedules={sampleSchedules}
      onPick={onPick}
      {...overrides}
    />,
  );
  return { onClose, onPick, ...result };
}

describe("ProgramSearchModal", () => {
  it("all かつ未入力ではキーワード入力を促す空状態を出す", () => {
    setup();
    expect(screen.getByText(t("search.emptyPrompt"))).toBeTruthy();
    expect(screen.getByText(t("search.emptyHint"))).toBeTruthy();
  });

  it("検索入力で番組が絞り込まれる", () => {
    setup();
    const input = screen.getByPlaceholderText(t("search.placeholder"));
    fireEvent.change(input, { target: { value: "ニュース７" } });
    expect(screen.getByText("ニュース７")).toBeTruthy();
    // 別番組は出ない。
    expect(screen.queryByText("きょうの料理")).toBeNull();
  });

  it("該当が無ければ noResults を出す", () => {
    setup();
    const input = screen.getByPlaceholderText(t("search.placeholder"));
    fireEvent.change(input, { target: { value: "存在しない番組名XYZ" } });
    expect(screen.getByText(t("search.noResults"))).toBeTruthy();
  });

  it("録画予約フィルタは録画対象 (全 state) を母集合にする (キーワード不要)", () => {
    setup();
    // sampleSchedules[0] = scheduled, sampleSchedules[1] = finished。両方表示される。
    fireEvent.click(screen.getByText(t("search.filter.reserved")));
    expect(screen.getByText("大河ドラマ アンコール")).toBeTruthy();
    expect(screen.getByText("ドキュメント72時間")).toBeTruthy();
  });

  it("録画予約フィルタの各行に state 別ステータスバッジを出す", () => {
    setup();
    fireEvent.click(screen.getByText(t("search.filter.reserved")));
    // scheduled → 録画予約, finished → 録画済。
    // 「録画予約」はタブ名と同一テキストなので件数で確認する (タブ + scheduled 行のバッジ)。
    expect(screen.getAllByText(t("program.recordingStatus.scheduled")).length)
      .toBeGreaterThanOrEqual(2);
    expect(screen.getByText(t("program.recordingStatus.finished"))).toBeTruthy();
  });

  it("結果行クリックで onPick が発火する", () => {
    const { onPick } = setup();
    const input = screen.getByPlaceholderText(t("search.placeholder"));
    fireEvent.change(input, { target: { value: "ニュース７" } });
    fireEvent.click(screen.getByText("ニュース７"));
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick.mock.calls[0][0].name).toBe("ニュース７");
  });

  it("キャンセルボタンで onClose が発火する", () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByText(t("search.cancel")));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
