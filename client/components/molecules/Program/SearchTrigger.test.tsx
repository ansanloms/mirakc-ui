import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import SearchTrigger from "./SearchTrigger.tsx";
import { t } from "../../../locales/i18n.ts";

describe("SearchTrigger", () => {
  it("検索ラベルを描画する", () => {
    render(<SearchTrigger onOpen={() => {}} />);
    expect(screen.getByText(t("program.toolbar.search"))).toBeTruthy();
  });

  it("クリックで onOpen が発火する", () => {
    const onOpen = vi.fn();
    render(<SearchTrigger onOpen={onOpen} />);
    fireEvent.click(screen.getByText(t("program.toolbar.search")));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
