import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import BandTabs from "./BandTabs.tsx";
import { BANDS } from "../../../lib/service.ts";

describe("BandTabs", () => {
  it("全 band のタブを描画する", () => {
    render(<BandTabs band="GR" onChangeBand={() => {}} />);
    for (const b of BANDS) {
      expect(screen.getByText(b.label)).toBeTruthy();
    }
  });

  it("別 band のタブをクリックすると onChangeBand が発火する", () => {
    const onChangeBand = vi.fn();
    render(<BandTabs band="GR" onChangeBand={onChangeBand} />);
    const bs = BANDS.find((b) => b.id === "BS")!;
    fireEvent.click(screen.getByText(bs.label));
    expect(onChangeBand).toHaveBeenCalledTimes(1);
    expect(onChangeBand).toHaveBeenCalledWith("BS");
  });

  it("選択中の band だけアクティブクラスが付く", () => {
    render(<BandTabs band="GR" onChangeBand={() => {}} />);
    const grLabel = BANDS.find((b) => b.id === "GR")!.label;
    const bsLabel = BANDS.find((b) => b.id === "BS")!.label;
    // 同一描画内で選択中 (GR) と非選択 (BS) のクラス文字列が異なる。
    expect(screen.getByText(grLabel).className).not.toBe(
      screen.getByText(bsLabel).className,
    );
  });
});
