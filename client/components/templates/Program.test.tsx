import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import Program from "./Program.tsx";
import { renderWithRouter } from "../../lib/test-router.tsx";
import { t } from "../../locales/i18n.ts";
import {
  buildSamplePrograms,
  sampleSchedules,
  sampleServices,
} from "../../lib/fixtures.ts";

// 「現在」起点で番組を組み、targetDate も現在にすることで番組表の表示窓
// (startOfHour(now)..+24h) に放送中・直後の番組が入る。時刻の厳密一致は避け、
// 構造 (ツールバー / リンク / 空状態) で検証する。
const now = Date.now();
const programs = buildSamplePrograms(now);

function setup(
  overrides: Partial<Parameters<typeof Program>[0]> = {},
) {
  return renderWithRouter(
    <Program
      services={sampleServices}
      programs={programs}
      recordingSchedules={sampleSchedules}
      targetDate={new Date(now)}
      setTargetDate={() => {}}
      setProgram={() => {}}
      addRecordingSchedule={() => {}}
      removeRecordingSchedule={() => {}}
      recordingLoading={false}
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

  it("GR の番組表 (サービスヘッダ Link) を描画する", async () => {
    setup();
    // 地上波 (GR) の放送局が表示窓内に出る。
    expect(await screen.findByText("NHK総合")).toBeTruthy();
    expect(screen.getAllByRole("link").length).toBeGreaterThan(0);
  });

  it("該当 band に放送局が無ければ空状態を出す", async () => {
    // GR サービスのみ渡し band 既定 GR のまま、サービスを空にして空状態へ。
    setup({ services: [] });
    expect(
      await screen.findByText(
        t("program.empty.title", { band: "地上波" }),
      ),
    ).toBeTruthy();
  });
});
