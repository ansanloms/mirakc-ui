import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import SelectTab from "./SelectTab.tsx";
import type { ChannelEntry } from "./SelectTab.tsx";
import { t } from "../../../locales/i18n.ts";
import { samplePrograms, sampleServices } from "../../../lib/fixtures.ts";

// NHK総合 (sampleServices[0]) を放送中番組付きで 1 行。
const channels: ChannelEntry[] = [
  {
    service: sampleServices[0],
    program: samplePrograms[0],
    nextProgram: samplePrograms[1],
    progress: 0.4,
  },
  {
    service: sampleServices[1],
    program: samplePrograms[3],
    progress: 0.1,
  },
];

describe("SelectTab", () => {
  it("band タブ (地上波/BS/CS) を描画する", () => {
    render(
      <SelectTab
        band="GR"
        onChangeBand={() => {}}
        channels={channels}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: "地上波" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "BS" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "CS" })).toBeTruthy();
  });

  it("チャンネル行 (放送局名 + 番組名) を描画する", () => {
    render(
      <SelectTab
        band="GR"
        onChangeBand={() => {}}
        channels={channels}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText("NHK総合")).toBeTruthy();
    expect(screen.getByText("ニュース７")).toBeTruthy();
  });

  it("band 切替ボタンで onChangeBand がその id で発火する", () => {
    const onChangeBand = vi.fn();
    render(
      <SelectTab
        band="GR"
        onChangeBand={onChangeBand}
        channels={channels}
        onSelect={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "BS" }));
    expect(onChangeBand).toHaveBeenCalledWith("BS");
  });

  it("チャンネル行クリックで onSelect が service を引数に発火する", () => {
    const onSelect = vi.fn();
    render(
      <SelectTab
        band="GR"
        onChangeBand={() => {}}
        channels={channels}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByText("ニュース７"));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0][0].name).toBe("NHK総合");
  });

  it("放送局が無い band は Empty (空状態) を出す", () => {
    render(
      <SelectTab
        band="BS"
        onChangeBand={() => {}}
        channels={[]}
        onSelect={() => {}}
      />,
    );
    // bandLabel(BS) でメッセージが組まれる。
    expect(screen.getByText(t("watch.empty.title", { band: "BS" })))
      .toBeTruthy();
  });
});
