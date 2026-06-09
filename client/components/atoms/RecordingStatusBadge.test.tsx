import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import RecordingStatusBadge from "./RecordingStatusBadge.tsx";
import { t } from "../../locales/i18n.ts";

describe("RecordingStatusBadge", () => {
  it("state を対応するラベルのバッジで表示する", () => {
    const cases = [
      ["scheduled", "program.badge.reserved"],
      ["tracking", "program.badge.reserved"],
      ["recording", "program.badge.recording"],
      ["rescheduling", "program.badge.failed"],
      ["finished", "program.badge.recorded"],
      ["failed", "program.badge.failed"],
    ] as const;
    for (const [state, key] of cases) {
      const { unmount } = render(<RecordingStatusBadge state={state} />);
      expect(screen.getByText(t(key))).toBeTruthy();
      unmount();
    }
  });

  it("recording のみ点滅ドット (内包 span) を持つ", () => {
    const rec = render(<RecordingStatusBadge state="recording" />);
    expect(rec.container.querySelector("span > span")).toBeTruthy();
    rec.unmount();

    const res = render(<RecordingStatusBadge state="scheduled" />);
    expect(res.container.querySelector("span > span")).toBeNull();
  });
});
