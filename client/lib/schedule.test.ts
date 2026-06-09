import { describe, expect, it } from "vitest";
import { recordingStatusKind } from "./schedule.ts";

describe("recordingStatusKind", () => {
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
      expect(recordingStatusKind(state)).toBe(kind);
    }
  });
});
