import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import BandTabList from "./BandTabList.tsx";
import { bandLabel, BANDS } from "../../../lib/service.ts";

describe("BandTabList", () => {
  it("全 band のタブを描画する", () => {
    render(<BandTabList band="GR" onChangeBand={() => {}} />);
    for (const id of BANDS) {
      expect(screen.getByText(bandLabel(id))).toBeTruthy();
    }
  });

  it("別 band のタブをクリックすると onChangeBand が発火する", () => {
    const onChangeBand = vi.fn();
    render(<BandTabList band="GR" onChangeBand={onChangeBand} />);
    fireEvent.click(screen.getByText(bandLabel("BS")));
    expect(onChangeBand).toHaveBeenCalledTimes(1);
    expect(onChangeBand).toHaveBeenCalledWith("BS");
  });

  it("選択中の band だけアクティブクラスが付く", () => {
    render(<BandTabList band="GR" onChangeBand={() => {}} />);
    // 同一描画内で選択中 (GR) と非選択 (BS) のクラス文字列が異なる。
    expect(screen.getByText(bandLabel("GR")).className).not.toBe(
      screen.getByText(bandLabel("BS")).className,
    );
  });
});
