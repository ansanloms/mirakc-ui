import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import ProgramModalDetail from "./Detail.tsx";
import { renderWithRouter } from "../../../../lib/test-router.tsx";
import {
  buildSamplePrograms,
  sampleServices,
} from "../../../../lib/fixtures.ts";
import type { components } from "../../../../lib/api/schema.d.ts";
import { t } from "../../../../locales/i18n.ts";

type Schedule = components["schemas"]["WebRecordingSchedule"];

const base = 1736900000000;
const programs = buildSamplePrograms(base);
const program = programs[0];
const service = sampleServices[0];

// 各放送状態を踏むための now (program.startAt 基準)。
const beforeStart = program.startAt - 60 * 60 * 1000; // upcoming
const duringAir = program.startAt + 60 * 1000; // airing
const afterEnd = program.startAt + program.duration + 60 * 1000; // ended

function setup(
  override: Partial<ComponentProps<typeof ProgramModalDetail>> = {},
) {
  const props = {
    program,
    service,
    addRecordingSchedule: vi.fn(),
    removeRecordingSchedule: vi.fn(),
    loading: false,
    open: true,
    onClose: vi.fn(),
    now: beforeStart,
    ...override,
  };
  return { ...renderWithRouter(<ProgramModalDetail {...props} />), props };
}

describe("ProgramModalDetail", () => {
  it("タイトル・チャンネル名・番組内容を描画する", async () => {
    setup();
    expect(await screen.findByText(program.name!)).toBeTruthy();
    expect(screen.getByText(service.name!)).toBeTruthy();
    expect(screen.getByText(program.description!)).toBeTruthy();
  });

  it("未開始 (upcoming) かつ予約なしで録画予約ボタンを出し、押すと addRecordingSchedule が発火する", async () => {
    const { props } = setup({ now: beforeStart, recordingSchedule: undefined });
    const reserveBtn = await screen.findByText(t("program.detail.reserve"));
    fireEvent.click(reserveBtn);
    expect(props.addRecordingSchedule).toHaveBeenCalledTimes(1);
  });

  it("未開始かつ予約済 (scheduled) で解除ボタンを出し、押すと removeRecordingSchedule が発火する", async () => {
    const schedule: Schedule = {
      program,
      state: "scheduled",
      options: { contentPath: "x.m2ts" },
      tags: [],
    };
    const { props } = setup({ now: beforeStart, recordingSchedule: schedule });
    const cancelBtn = await screen.findByText(
      t("program.detail.cancelReserve"),
    );
    fireEvent.click(cancelBtn);
    expect(props.removeRecordingSchedule).toHaveBeenCalledTimes(1);
    // 予約ボタンは出ない。
    expect(screen.queryByText(t("program.detail.reserve"))).toBeNull();
  });

  it("放送中 (airing) で視聴 Link を出す", async () => {
    setup({ now: duringAir });
    const watchLink = await screen.findByText(t("program.detail.watch"));
    // Link は <a> として描画される。
    expect(watchLink.closest("a")).not.toBeNull();
    // 放送中は録画予約系ボタンを出さない。
    expect(screen.queryByText(t("program.detail.reserve"))).toBeNull();
  });

  it("終了 (ended) かつ録画済でなければ操作ボタンは閉じるのみ", async () => {
    setup({ now: afterEnd, recordingSchedule: undefined });
    await screen.findByText(program.name!);
    expect(screen.queryByText(t("program.detail.reserve"))).toBeNull();
    expect(screen.queryByText(t("program.detail.cancelReserve"))).toBeNull();
    expect(screen.queryByText(t("program.detail.watch"))).toBeNull();
    expect(screen.getByText(t("program.detail.close"))).toBeTruthy();
  });

  it("録画済 (state=finished) で録画済バッジを出す", async () => {
    const schedule: Schedule = {
      program,
      state: "finished",
      options: { contentPath: "x.m2ts" },
      tags: [],
    };
    setup({ now: afterEnd, recordingSchedule: schedule });
    await screen.findByText(program.name!);
    // recorded バッジ (foot とタグの両方に出る)。
    expect(screen.getAllByText(t("program.detail.recorded")).length)
      .toBeGreaterThan(0);
  });

  it("閉じるボタンで onClose が発火する", async () => {
    const { props } = setup();
    const closeBtn = await screen.findByText(t("program.detail.close"));
    fireEvent.click(closeBtn);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("loading 中は予約ボタンを押しても addRecordingSchedule が発火しない", async () => {
    const { props } = setup({
      now: beforeStart,
      recordingSchedule: undefined,
      loading: true,
    });
    const reserveBtn = await screen.findByText(t("program.detail.reserve"));
    fireEvent.click(reserveBtn);
    expect(props.addRecordingSchedule).not.toHaveBeenCalled();
  });
});
