import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBadge from "./StatusBadge.tsx";
import { t } from "../../locales/i18n.ts";

describe("StatusBadge", () => {
  it("live は固定で LIVE と表示する", () => {
    render(<StatusBadge kind="live" />);
    expect(screen.getByText("LIVE")).toBeTruthy();
  });

  it("new / reserved / recorded は対応する翻訳ラベルを表示する", () => {
    for (
      const [kind, key] of [
        ["new", "program.badge.new"],
        ["reserved", "program.badge.reserved"],
        ["recorded", "program.badge.recorded"],
      ] as const
    ) {
      const { unmount } = render(<StatusBadge kind={kind} />);
      expect(screen.getByText(t(key))).toBeTruthy();
      unmount();
    }
  });
});
