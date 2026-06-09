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

  it("state ごとに対応する録画ステータスバッジを出す", () => {
    const cases = [
      ["scheduled", "program.badge.reserved"],
      ["tracking", "program.badge.reserved"],
      ["recording", "program.badge.recording"],
      ["rescheduling", "program.badge.failed"],
      ["finished", "program.badge.recorded"],
      ["failed", "program.badge.failed"],
    ] as const;
    for (const [state, key] of cases) {
      const { unmount } = render(
        <ProgramItem program={program} state={state} now={program.startAt} />,
      );
      expect(screen.getByText(t(key))).toBeTruthy();
      unmount();
    }
  });

  it("state 無しなら録画ステータスバッジを出さない", () => {
    render(<ProgramItem program={program} now={program.startAt} />);
    expect(screen.queryByText(t("program.badge.reserved"))).toBeNull();
    expect(screen.queryByText(t("program.badge.recorded"))).toBeNull();
  });
});
