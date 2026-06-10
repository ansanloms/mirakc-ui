import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import KeywordRulesTrigger from "./KeywordRulesTrigger.tsx";
import { t } from "../../../locales/i18n.ts";

describe("KeywordRulesTrigger", () => {
  it("ラベルを描画しクリックで onOpen が発火する", () => {
    const onOpen = vi.fn();
    render(<KeywordRulesTrigger onOpen={onOpen} />);

    fireEvent.click(screen.getByText(t("keyword.toolbar.open")));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });
});
