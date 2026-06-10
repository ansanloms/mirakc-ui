import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ProgramItem from "./Item.tsx";
import { buildSamplePrograms } from "../../../lib/fixtures.ts";
import { t } from "../../../locales/i18n.ts";

const base = 1736900000000;
const programs = buildSamplePrograms(base);
const program = programs[0];

describe("ProgramItem", () => {
  it("タイトルを描画する", () => {
    render(<ProgramItem program={program} />);
    expect(screen.getByText(program.name!)).toBeTruthy();
  });

  it("番組名のステータス記号を抽出して表示し、タイトルからは除去する", () => {
    const withMarks = { ...program, name: "ニュース７[字][デ]" };
    render(<ProgramItem program={withMarks} />);
    // 記号を除いたクリーンなタイトル。
    expect(screen.getByText("ニュース７")).toBeTruthy();
    // 記号チップ (短縮表記)。
    expect(screen.getByText("字")).toBeTruthy();
    expect(screen.getByText("デ")).toBeTruthy();
    // 角括弧付きの生文字列は出ない。
    expect(screen.queryByText("ニュース７[字][デ]")).toBeNull();
  });

  it("state ごとに対応する録画ステータスバッジを出す", () => {
    const cases = [
      ["scheduled", "program.recordingStatus.scheduled"],
      ["tracking", "program.recordingStatus.tracking"],
      ["recording", "program.recordingStatus.recording"],
      ["rescheduling", "program.recordingStatus.rescheduling"],
      ["finished", "program.recordingStatus.finished"],
      ["failed", "program.recordingStatus.failed"],
    ] as const;
    for (const [state, key] of cases) {
      const { unmount } = render(
        <ProgramItem program={program} state={state} />,
      );
      expect(screen.getByText(t(key))).toBeTruthy();
      unmount();
    }
  });

  it("state 無しなら録画ステータスバッジを出さない", () => {
    render(<ProgramItem program={program} />);
    expect(screen.queryByText(t("program.recordingStatus.scheduled")))
      .toBeNull();
    expect(screen.queryByText(t("program.recordingStatus.finished")))
      .toBeNull();
  });
});
