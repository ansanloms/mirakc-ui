import { describe, expect, it } from "vitest";
import { scheduleStatusKind } from "./schedule.ts";

describe("scheduleStatusKind", () => {
  it("6 つの state を 4 つの表示カテゴリへ畳む", () => {
    const cases = [
      ["scheduled", "reserved"],
      ["tracking", "reserved"],
      ["recording", "recording"],
      ["rescheduling", "failed"],
      ["finished", "recorded"],
      ["failed", "failed"],
    ] as const;
    for (const [state, kind] of cases) {
      expect(scheduleStatusKind(state)).toBe(kind);
    }
  });
});
