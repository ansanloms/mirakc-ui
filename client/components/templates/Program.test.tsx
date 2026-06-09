import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import Program from "./Program.tsx";
import { renderWithRouter } from "../../lib/test-router.tsx";
import { nowZoned } from "../../lib/datetime.ts";
import { t } from "../../locales/i18n.ts";
import {
  buildSamplePrograms,
  sampleSchedules,
  sampleServices,
} from "../../lib/fixtures.ts";

// 「現在」起点で番組を組み、targetDate も現在にすることで番組表の表示窓
// (startOfHour(now)..+24h) に放送中・直後の番組が入る。時刻の厳密一致は避け、
// 構造 (ツールバー / リンク / 空状態) で検証する。
const today = nowZoned();
const now = today.epochMilliseconds;
const programs = buildSamplePrograms(now);

function setup(
  overrides: Partial<Parameters<typeof Program>[0]> = {},
) {
  return renderWithRouter(
    <Program
      services={sampleServices}
      programs={programs}
      recordingSchedules={sampleSchedules}
      targetDate={today}
      setTargetDate={() => {}}
      channelType="GR"
      onChangeChannelType={() => {}}
      onSelectProgram={() => {}}
      onOpenSearch={() => {}}
      {...overrides}
    />,
  );
}

describe("Program template", () => {
  it("ツールバーの検索トリガーを描画する", async () => {
    setup();
    expect(
      await screen.findByText(t("program.toolbar.search")),
    ).toBeTruthy();
  });

  it("channelType=GR では地上波の番組表 (サービスヘッダ Link) を描画する", async () => {
    setup();
    // 地上波 (GR) の放送局が表示窓内に出る。
    expect(await screen.findByText("NHK総合")).toBeTruthy();
    expect(screen.getAllByRole("link").length).toBeGreaterThan(0);
  });

  it("channelType=BS では BS の放送局を描画する", async () => {
    setup({ channelType: "BS" });
    expect(await screen.findByText("BS NHK")).toBeTruthy();
    // 地上波の放送局は出ない。
    expect(screen.queryByText("NHK総合")).toBeNull();
  });

  it("該当 channel type に放送局が無ければ空状態を出す", async () => {
    setup({ services: [] });
    expect(
      await screen.findByText(
        t("program.empty.title", { channelType: "地上波" }),
      ),
    ).toBeTruthy();
  });

  it("channel type タブのクリックで onChangeChannelType が発火する", async () => {
    const onChangeChannelType = vi.fn();
    setup({ onChangeChannelType });
    fireEvent.click(await screen.findByText(t("program.channelType.BS")));
    expect(onChangeChannelType).toHaveBeenCalledWith("BS");
  });

  it("検索トリガーのクリックで onOpenSearch が発火する", async () => {
    const onOpenSearch = vi.fn();
    setup({ onOpenSearch });
    fireEvent.click(await screen.findByText(t("program.toolbar.search")));
    expect(onOpenSearch).toHaveBeenCalledTimes(1);
  });

  it("番組セルのクリックで onSelectProgram が発火する", async () => {
    const onSelectProgram = vi.fn();
    setup({ onSelectProgram });
    // 表示窓内の番組 (NHK総合 の番組) をクリックする。
    fireEvent.click(await screen.findByText("ニュース７"));
    expect(onSelectProgram).toHaveBeenCalledTimes(1);
    expect(onSelectProgram.mock.calls[0][0].name).toBe("ニュース７");
  });
});
