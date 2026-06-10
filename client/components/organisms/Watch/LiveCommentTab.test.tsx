import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import LiveCommentTab from "./LiveCommentTab.tsx";
import { sampleLiveComments } from "../../../lib/fixtures.ts";
import { t } from "../../../locales/i18n.ts";

const comments = sampleLiveComments;
const others = sampleLiveComments[0]; // me=false
const mine = sampleLiveComments[3]; // me=true

describe("LiveCommentTab", () => {
  it("未接続かつコメント空のとき disconnected 案内を出す", () => {
    render(
      <LiveCommentTab comments={[]} connected={false} onPost={() => {}} />,
    );
    expect(screen.getByText(t("watch.live.disconnected"))).toBeTruthy();
  });

  it("コメント配列が描画される (接続済み分岐)", () => {
    render(
      <LiveCommentTab comments={comments} connected onPost={() => {}} />,
    );
    expect(screen.getByText(others.text)).toBeTruthy();
    expect(screen.getByText(mine.text)).toBeTruthy();
    // feed が出ているので disconnected 案内は無い。
    expect(screen.queryByText(t("watch.live.disconnected"))).toBeNull();
  });

  it("未接続でもコメントがあれば feed を描画する", () => {
    render(
      <LiveCommentTab
        comments={comments}
        connected={false}
        onPost={() => {}}
      />,
    );
    expect(screen.getByText(others.text)).toBeTruthy();
    expect(screen.queryByText(t("watch.live.disconnected"))).toBeNull();
  });

  it("空文字では送信ボタンが disabled で onPost は呼ばれない", () => {
    const onPost = vi.fn();
    render(<LiveCommentTab comments={[]} connected onPost={onPost} />);
    const button = screen.getByRole("button", { name: t("watch.live.send") });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    fireEvent.submit(button.closest("form")!);
    expect(onPost).not.toHaveBeenCalled();
  });

  it("入力して submit すると onPost が trim 済み本文で発火する", () => {
    const onPost = vi.fn();
    render(<LiveCommentTab comments={[]} connected onPost={onPost} />);
    const input = screen.getByPlaceholderText(t("watch.live.placeholder"));
    fireEvent.change(input, { target: { value: "  やあ  " } });
    fireEvent.submit(input.closest("form")!);
    expect(onPost).toHaveBeenCalledTimes(1);
    expect(onPost).toHaveBeenCalledWith("やあ");
    // 送信後は入力がクリアされる。
    expect((input as HTMLInputElement).value).toBe("");
  });
});
