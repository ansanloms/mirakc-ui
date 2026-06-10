import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ProgramMarks from "./ProgramMarks.tsx";
import { extractProgramMarks } from "../../lib/program-status.ts";

// 正準順で [字, デ, SS]。
const marks = extractProgramMarks("[字][デ][SS]").marks;

describe("ProgramMarks", () => {
  it("各記号を短縮表記 (locales) で描画する", () => {
    render(<ProgramMarks marks={marks} />);
    expect(screen.getByText("字")).toBeTruthy();
    expect(screen.getByText("デ")).toBeTruthy();
    expect(screen.getByText("SS")).toBeTruthy();
  });

  it("title 属性に意味 (label) を設定する", () => {
    render(<ProgramMarks marks={marks} />);
    expect(screen.getByText("字").getAttribute("title")).toBe("字幕放送");
  });

  it("title バリアントは囲み文字ではなく意味ラベルを表示する", () => {
    render(<ProgramMarks marks={marks} variant="title" />);
    expect(screen.getByText("字幕放送")).toBeTruthy();
    expect(screen.getByText("サラウンドステレオ放送")).toBeTruthy();
    // 囲み文字単体は出ない。
    expect(screen.queryByText("字")).toBeNull();
  });

  it("max を超える分は描画しない", () => {
    render(<ProgramMarks marks={marks} max={2} />);
    expect(screen.getByText("字")).toBeTruthy();
    expect(screen.getByText("デ")).toBeTruthy();
    expect(screen.queryByText("SS")).toBeNull();
  });

  it("marks が空なら何も描画しない", () => {
    const { container } = render(<ProgramMarks marks={[]} />);
    expect(container.firstChild).toBeNull();
  });
});
