import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import RecordingStatusBadge from "./RecordingStatusBadge.tsx";
import { t } from "../../locales/i18n.ts";

describe("RecordingStatusBadge", () => {
  it("state を対応するラベルのバッジで表示する", () => {
    const cases = [
      ["scheduled", "program.recordingStatus.scheduled"],
      ["tracking", "program.recordingStatus.tracking"],
      ["recording", "program.recordingStatus.recording"],
      ["rescheduling", "program.recordingStatus.rescheduling"],
      ["finished", "program.recordingStatus.finished"],
      ["failed", "program.recordingStatus.failed"],
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
