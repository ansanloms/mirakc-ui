import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ScheduleStatusBadge from "./ScheduleStatusBadge.tsx";
import { t } from "../../locales/i18n.ts";

describe("ScheduleStatusBadge", () => {
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
      const { unmount } = render(<ScheduleStatusBadge state={state} />);
      expect(screen.getByText(t(key))).toBeTruthy();
      unmount();
    }
  });
});
