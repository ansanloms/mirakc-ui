import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import CommentFeed from "./CommentFeed.tsx";
import { sampleLiveComments } from "../../../lib/fixtures.ts";
import { t } from "../../../locales/i18n.ts";

const comments = sampleLiveComments;

/** feed 要素 (スクロールコンテナ) を取得する。コメント行の親要素。 */
function feedOf(): HTMLElement {
  return screen.getByText(comments[0].text).closest("div")!
    .parentElement as HTMLElement;
}

/** スクロール位置を擬似的に再現する (happy-dom は layout を持たないため)。 */
function defineScroll(
  el: HTMLElement,
  metrics: { scrollHeight: number; clientHeight: number; scrollTop: number },
) {
  Object.defineProperty(el, "scrollHeight", {
    value: metrics.scrollHeight,
    configurable: true,
  });
  Object.defineProperty(el, "clientHeight", {
    value: metrics.clientHeight,
    configurable: true,
  });
  el.scrollTop = metrics.scrollTop;
}

describe("CommentFeed", () => {
  it("コメント列を描画する", () => {
    render(<CommentFeed comments={comments} />);
    expect(screen.getByText(comments[0].text)).toBeTruthy();
    expect(
      screen.getByText(comments[comments.length - 1].text),
    ).toBeTruthy();
  });

  it("上にスクロールすると「最新のコメントへ」ボタンが現れる", () => {
    render(<CommentFeed comments={comments} />);
    const button = screen.getByRole("button", {
      name: t("watch.live.jumpToLatest"),
    });
    const hiddenClass = button.className;

    const feed = feedOf();
    // 末尾から 600px 上 = 離脱
    defineScroll(feed, {
      scrollHeight: 1000,
      clientHeight: 300,
      scrollTop: 100,
    });
    fireEvent.scroll(feed);
    expect(button.className).not.toBe(hiddenClass);

    // 末尾付近 (60px 未満) に戻ると消える
    defineScroll(feed, {
      scrollHeight: 1000,
      clientHeight: 300,
      scrollTop: 950,
    });
    fireEvent.scroll(feed);
    expect(button.className).toBe(hiddenClass);
  });

  it("ボタン押下で末尾へスクロールしてボタンが消える", () => {
    render(<CommentFeed comments={comments} />);
    const button = screen.getByRole("button", {
      name: t("watch.live.jumpToLatest"),
    });
    const hiddenClass = button.className;

    const feed = feedOf();
    defineScroll(feed, { scrollHeight: 1000, clientHeight: 300, scrollTop: 0 });
    fireEvent.scroll(feed);
    expect(button.className).not.toBe(hiddenClass);

    const scrollTo = vi.fn();
    (feed as HTMLElement & { scrollTo: typeof scrollTo }).scrollTo = scrollTo;
    fireEvent.click(button);
    expect(scrollTo).toHaveBeenCalledWith({ top: 1000, behavior: "smooth" });
    expect(button.className).toBe(hiddenClass);
  });

  it("onVideo (プレイヤー内) では「最新のコメントへ」ボタンを出さない", () => {
    render(<CommentFeed comments={comments} onVideo />);
    expect(
      screen.queryByRole("button", { name: t("watch.live.jumpToLatest") }),
    ).toBeNull();
  });

  it("onVideo でラッパーのクラスが変わる", () => {
    const { container } = render(<CommentFeed comments={comments} />);
    const base = (container.firstChild as HTMLElement).className;

    const { container: c2 } = render(
      <CommentFeed comments={comments} onVideo />,
    );
    expect((c2.firstChild as HTMLElement).className).not.toBe(base);
  });
});
