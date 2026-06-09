import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import RightPanel from "./RightPanel.tsx";
import { t } from "../../../locales/i18n.ts";

describe("RightPanel", () => {
  it("3 つのタブと children を描画する", () => {
    render(
      <RightPanel tab="select" onChangeTab={() => {}} liveCount={0}>
        <p>本文コンテンツ</p>
      </RightPanel>,
    );
    expect(
      screen.getByRole("button", { name: t("watch.tab.select") }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: t("watch.tab.info") }),
    ).toBeTruthy();
    // live タブはラベル + バッジ件数を含む。
    expect(
      screen.getByRole("button", {
        name: new RegExp(t("watch.tab.live")),
      }),
    ).toBeTruthy();
    expect(screen.getByText("本文コンテンツ")).toBeTruthy();
  });

  it("live タブに件数バッジが出る", () => {
    render(
      <RightPanel tab="select" onChangeTab={() => {}} liveCount={5}>
        <p />
      </RightPanel>,
    );
    expect(screen.getByText("5")).toBeTruthy();
  });

  it("タブクリックで onChangeTab がその id で発火する", () => {
    const onChangeTab = vi.fn();
    render(
      <RightPanel tab="select" onChangeTab={onChangeTab} liveCount={0}>
        <p />
      </RightPanel>,
    );
    fireEvent.click(screen.getByRole("button", { name: t("watch.tab.info") }));
    expect(onChangeTab).toHaveBeenCalledTimes(1);
    expect(onChangeTab).toHaveBeenCalledWith("info");
  });

  it("tab prop でアクティブタブの aria/クラスが切り替わる (info アクティブ)", () => {
    const { rerender } = render(
      <RightPanel tab="select" onChangeTab={() => {}} liveCount={0}>
        <p />
      </RightPanel>,
    );
    const infoBtn = screen.getByRole("button", { name: t("watch.tab.info") });
    const selectBtn = screen.getByRole("button", {
      name: t("watch.tab.select"),
    });
    const activeBefore = infoBtn.className;
    rerender(
      <RightPanel tab="info" onChangeTab={() => {}} liveCount={0}>
        <p />
      </RightPanel>,
    );
    // info タブのクラスが select アクティブ時と変わる (active クラス付与)。
    expect(infoBtn.className).not.toBe(activeBefore);
    expect(infoBtn.className).not.toBe(selectBtn.className);
  });
});
