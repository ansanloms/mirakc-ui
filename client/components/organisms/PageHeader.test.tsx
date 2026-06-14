import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import PageHeader from "./PageHeader.tsx";

function setup(override: Partial<Parameters<typeof PageHeader>[0]> = {}) {
  const onBack = vi.fn();
  const onWatch = vi.fn();
  const props = {
    icon: "settings",
    title: "設定",
    subtitle: "サブタイトル",
    links: [
      { icon: "grid_view", label: "番組表へ", onClick: onBack },
      { icon: "live_tv", label: "視聴画面を開く", onClick: onWatch },
    ],
    ...override,
  };
  return { ...render(<PageHeader {...props} />), onBack, onWatch };
}

describe("PageHeader", () => {
  it("タイトル・サブタイトルを描画する", () => {
    setup();
    expect(screen.getByText("設定")).toBeTruthy();
    expect(screen.getByText("サブタイトル")).toBeTruthy();
  });

  it("links を aria-label 付きアイコンボタンとして描画する", () => {
    setup();
    expect(screen.getByLabelText("番組表へ")).toBeTruthy();
    expect(screen.getByLabelText("視聴画面を開く")).toBeTruthy();
  });

  it("リンクのクリックで対応する onClick が発火する", () => {
    const { onBack, onWatch } = setup();
    fireEvent.click(screen.getByLabelText("番組表へ"));
    expect(onBack).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByLabelText("視聴画面を開く"));
    expect(onWatch).toHaveBeenCalledTimes(1);
  });

  it("children (スロット) を描画する", () => {
    setup({ children: <div data-testid="slot">slot</div> });
    expect(screen.getByTestId("slot")).toBeTruthy();
  });
});
