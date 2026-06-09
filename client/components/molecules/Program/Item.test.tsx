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
    // 記号チップ。
    expect(screen.getByText("字")).toBeTruthy();
    expect(screen.getByText("デ")).toBeTruthy();
    // 角括弧付きの生文字列は出ない。
    expect(screen.queryByText("ニュース７[字][デ]")).toBeNull();
  });

  it("recorded で録画済フラグを出す", () => {
    render(<ProgramItem program={program} recorded />);
    expect(screen.getByText(t("program.badge.recorded"))).toBeTruthy();
  });

  it("reserved (recorded でない) で REC フラグを出す", () => {
    render(<ProgramItem program={program} reserved />);
    expect(screen.getByText("REC")).toBeTruthy();
    // recorded ラベルは出ない。
    expect(screen.queryByText(t("program.badge.recorded"))).toBeNull();
  });

  it("recorded は reserved より優先される", () => {
    render(<ProgramItem program={program} recorded reserved />);
    expect(screen.getByText(t("program.badge.recorded"))).toBeTruthy();
    expect(screen.queryByText("REC")).toBeNull();
  });

  it("recorded も reserved も無ければフラグを出さない", () => {
    render(<ProgramItem program={program} />);
    expect(screen.queryByText("REC")).toBeNull();
    expect(screen.queryByText(t("program.badge.recorded"))).toBeNull();
  });
});
