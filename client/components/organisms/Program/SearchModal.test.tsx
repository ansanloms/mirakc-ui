import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import ProgramSearchModal, { SEARCH_DEBOUNCE_MS } from "./SearchModal.tsx";
import { t } from "../../../locales/i18n.ts";
import {
  samplePrograms,
  sampleSchedules,
  sampleServices,
} from "../../../lib/fixtures.ts";

// query は draft + debounce で間引かれる。テストでは fake timer で確定タイミングを
// 制御する。
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function setup(
  overrides: Partial<Parameters<typeof ProgramSearchModal>[0]> = {},
) {
  const onClose = vi.fn();
  const onPick = vi.fn();
  const onQueryChange = vi.fn();
  const onFilterChange = vi.fn();
  const result = render(
    <ProgramSearchModal
      open
      onClose={onClose}
      query=""
      onQueryChange={onQueryChange}
      filter="all"
      onFilterChange={onFilterChange}
      programs={samplePrograms}
      services={sampleServices}
      schedules={sampleSchedules}
      onPick={onPick}
      {...overrides}
    />,
  );
  return { onClose, onPick, onQueryChange, onFilterChange, ...result };
}

/** 入力して debounce を確定させる。 */
function typeQuery(value: string) {
  const input = screen.getByPlaceholderText(t("search.placeholder"));
  fireEvent.change(input, { target: { value } });
  act(() => {
    vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
  });
  return input;
}

describe("ProgramSearchModal", () => {
  it("all かつ未入力ではキーワード入力を促す空状態を出す", () => {
    setup();
    expect(screen.getByText(t("search.emptyPrompt"))).toBeTruthy();
    expect(screen.getByText(t("search.emptyHint"))).toBeTruthy();
  });

  it("検索入力で番組が絞り込まれる", () => {
    setup();
    typeQuery("ニュース７");
    expect(screen.getByText("ニュース７")).toBeTruthy();
    // 別番組は出ない。
    expect(screen.queryByText("きょうの料理")).toBeNull();
  });

  it("該当が無ければ noResults を出す", () => {
    setup();
    typeQuery("存在しない番組名XYZ");
    expect(screen.getByText(t("search.noResults"))).toBeTruthy();
  });

  it("録画予約フィルタ (filter=reserved) は録画対象 (全 state) を母集合にする", () => {
    setup({ filter: "reserved" });
    // sampleSchedules[0] = scheduled, sampleSchedules[1] = finished。両方表示される。
    expect(screen.getByText("大河ドラマ アンコール")).toBeTruthy();
    expect(screen.getByText("ドキュメント72時間")).toBeTruthy();
  });

  it("録画予約フィルタの各行に state 別ステータスバッジを出す", () => {
    setup({ filter: "reserved" });
    // scheduled → 録画予約, finished → 録画済。
    // 「録画予約」はタブ名と同一テキストなので件数で確認する (タブ + scheduled 行のバッジ)。
    expect(screen.getAllByText(t("program.recordingStatus.scheduled")).length)
      .toBeGreaterThanOrEqual(2);
    expect(screen.getByText(t("program.recordingStatus.finished")))
      .toBeTruthy();
  });

  it("フィルタタブのクリックで onFilterChange が発火する", () => {
    const { onFilterChange } = setup();
    fireEvent.click(screen.getByText(t("search.filter.reserved")));
    expect(onFilterChange).toHaveBeenCalledWith("reserved");
  });

  it("結果行クリックで onPick が発火する", () => {
    const { onPick } = setup();
    typeQuery("ニュース７");
    fireEvent.click(screen.getByText("ニュース７"));
    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick.mock.calls[0][0].name).toBe("ニュース７");
  });

  it("キャンセルボタンで onClose が発火する", () => {
    const { onClose } = setup();
    fireEvent.click(screen.getByText(t("search.cancel")));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("非 IME 入力は間引いてから onQueryChange を呼ぶ", () => {
    const { onQueryChange } = setup();
    const input = screen.getByPlaceholderText(t("search.placeholder"));
    fireEvent.change(input, { target: { value: "news" } });
    // 間引き前は呼ばれない。
    expect(onQueryChange).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });
    expect(onQueryChange).toHaveBeenCalledWith("news");
  });

  it("IME 変換中は onQueryChange を呼ばず、確定 (compositionEnd) で呼ぶ", () => {
    const { onQueryChange } = setup();
    const input = screen.getByPlaceholderText(t("search.placeholder"));
    // 変換中は URL へ反映しない (毎打鍵 navigate で変換が壊れるのを防ぐ)。
    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: "にゅ" } });
    fireEvent.change(input, { target: { value: "ニュース" } });
    act(() => {
      vi.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });
    expect(onQueryChange).not.toHaveBeenCalled();
    // 入力欄 (draft) には変換中の値が出る。
    expect((input as HTMLInputElement).value).toBe("ニュース");
    // 確定で URL へ反映する。
    fireEvent.compositionEnd(input, { target: { value: "ニュース" } });
    expect(onQueryChange).toHaveBeenCalledWith("ニュース");
  });
});
