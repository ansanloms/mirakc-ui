import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ProgramItem from "./Item.tsx";
import { buildSamplePrograms } from "../../../lib/fixtures.ts";
import { t } from "../../../locales/i18n.ts";

// 固定基準時刻で番組を組み、now を注入して LIVE 判定を決め打ちする。
const base = 1736900000000;
const programs = buildSamplePrograms(base);
const program = programs[0];

describe("ProgramItem", () => {
  it("タイトルを描画する", () => {
    render(<ProgramItem program={program} now={program.startAt} />);
    expect(screen.getByText(program.name!)).toBeTruthy();
  });

  it("now が放送中 (startAt..startAt+duration 内) なら LIVE バッジを出す", () => {
    render(
      <ProgramItem program={program} now={program.startAt + 60 * 1000} />,
    );
    expect(screen.getByText("LIVE")).toBeTruthy();
  });

  it("now が放送時間外なら LIVE バッジを出さない", () => {
    render(
      <ProgramItem program={program} now={program.startAt - 60 * 1000} />,
    );
    expect(screen.queryByText("LIVE")).toBeNull();
  });

  it("recorded で録画済フラグを出す", () => {
    render(
      <ProgramItem program={program} recorded now={program.startAt} />,
    );
    expect(screen.getByText(t("program.badge.recorded"))).toBeTruthy();
  });

  it("reserved (recorded でない) で REC フラグを出す", () => {
    render(
      <ProgramItem program={program} reserved now={program.startAt} />,
    );
    expect(screen.getByText("REC")).toBeTruthy();
    // recorded ラベルは出ない。
    expect(screen.queryByText(t("program.badge.recorded"))).toBeNull();
  });

  it("recorded は reserved より優先される", () => {
    render(
      <ProgramItem program={program} recorded reserved now={program.startAt} />,
    );
    expect(screen.getByText(t("program.badge.recorded"))).toBeTruthy();
    expect(screen.queryByText("REC")).toBeNull();
  });

  it("recorded も reserved も無ければフラグを出さない", () => {
    render(<ProgramItem program={program} now={program.startAt} />);
    expect(screen.queryByText("REC")).toBeNull();
    expect(screen.queryByText(t("program.badge.recorded"))).toBeNull();
  });
});
