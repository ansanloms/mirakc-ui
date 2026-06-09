import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Comment from "./Comment.tsx";
import { sampleLiveComments } from "../../../lib/fixtures.ts";

const others = sampleLiveComments[0]; // me=false
const mine = sampleLiveComments[3]; // me=true (「あなた」)

describe("Comment", () => {
  it("名前・時刻・本文を描画する", () => {
    render(<Comment comment={others} />);
    expect(screen.getByText(others.name)).toBeTruthy();
    expect(screen.getByText(others.time)).toBeTruthy();
    expect(screen.getByText(others.text)).toBeTruthy();
  });

  it("他人のコメントは me クラスが付かない", () => {
    const { container } = render(<Comment comment={others} />);
    const otherClass = (container.firstChild as HTMLElement).className;

    const { container: c2 } = render(<Comment comment={mine} />);
    const meClass = (c2.firstChild as HTMLElement).className;

    // me フラグでクラス文字列が変わる (自分の投稿は強調背景)。
    expect(meClass).not.toBe(otherClass);
  });

  it("自分のコメントも名前・時刻・本文を描画する", () => {
    render(<Comment comment={mine} />);
    expect(screen.getByText(mine.name)).toBeTruthy();
    expect(screen.getByText(mine.time)).toBeTruthy();
    expect(screen.getByText(mine.text)).toBeTruthy();
  });
});
