import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import ProgramTable from "./Table.tsx";
import { renderWithRouter } from "../../../lib/test-router.tsx";
import { zonedFromEpochMs } from "../../../lib/datetime.ts";
import {
  buildSamplePrograms,
  sampleSchedules,
  sampleServices,
} from "../../../lib/fixtures.ts";
import type { components } from "../../../lib/api/schema.d.ts";

type Schedule = components["schemas"]["WebRecordingSchedule"];

// 固定の基準時刻で番組を組み、表示窓と現在時刻を決め打ちする（now を注入）。
const base = 1736900000000;
const programs = buildSamplePrograms(base);
const fromMs = base - 60 * 60 * 1000;
const toMs = base + 5 * 60 * 60 * 1000;
const now = base + 10 * 60 * 1000;

function setup(setProgram = () => {}) {
  return renderWithRouter(
    <ProgramTable
      services={sampleServices}
      programs={programs}
      recordingSchedules={sampleSchedules}
      displayFromMs={fromMs}
      displayToMs={toMs}
      currentDate={zonedFromEpochMs(now)}
      setProgram={setProgram}
    />,
  );
}

describe("ProgramTable", () => {
  it("番組名とサービスヘッダ（Link）を描画する", async () => {
    setup();
    // Link がルータ context で解決され、番組・サービスが表示される。
    expect(await screen.findByText("ニュース７")).toBeTruthy();
    expect(screen.getByText("NHK総合")).toBeTruthy();
    expect(screen.getAllByRole("link").length).toBeGreaterThan(0);
  });

  it("番組セルのクリックで setProgram が呼ばれる", async () => {
    const setProgram = vi.fn();
    setup(setProgram);
    const cell = (await screen.findByText("ニュース７")).closest(
      '[role="button"]',
    );
    expect(cell).not.toBeNull();
    fireEvent.click(cell!);
    expect(setProgram).toHaveBeenCalledTimes(1);
  });

  it("録画スケジュールの state をセルの data-mark に反映する", async () => {
    const schedule: Schedule = {
      program: programs[0],
      state: "recording",
      options: { contentPath: "x.m2ts" },
      tags: [],
    };
    renderWithRouter(
      <ProgramTable
        services={sampleServices}
        programs={programs}
        recordingSchedules={[schedule]}
        displayFromMs={fromMs}
        displayToMs={toMs}
        currentDate={zonedFromEpochMs(now)}
        setProgram={() => {}}
      />,
    );
    const cell = (await screen.findByText("ニュース７")).closest(
      '[role="button"]',
    );
    expect(cell?.getAttribute("data-mark")).toBe("recording");
  });
});
