import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBadge from "./StatusBadge.tsx";
import { t } from "../../locales/i18n.ts";

describe("StatusBadge", () => {
  it("live は固定で LIVE と表示する", () => {
    render(<StatusBadge kind="live" />);
    expect(screen.getByText("LIVE")).toBeTruthy();
  });

  it("各種別は対応する翻訳ラベルを表示する", () => {
    for (
      const [kind, key] of [
        ["new", "program.badge.new"],
        ["reserved", "program.badge.reserved"],
        ["recording", "program.badge.recording"],
        ["failed", "program.badge.failed"],
        ["recorded", "program.badge.recorded"],
      ] as const
    ) {
      const { unmount } = render(<StatusBadge kind={kind} />);
      expect(screen.getByText(t(key))).toBeTruthy();
      unmount();
    }
  });

  it("recording のみ点滅ドット (内包 span) を持つ", () => {
    const rec = render(<StatusBadge kind="recording" />);
    expect(rec.container.querySelector("span > span")).toBeTruthy();
    rec.unmount();

    const res = render(<StatusBadge kind="reserved" />);
    expect(res.container.querySelector("span > span")).toBeNull();
  });
});
