import { describe, expect, it } from "vitest";
import { planDefaultApply } from "./live-comment-defaults.ts";
import type { LiveCommentDefaultMapping } from "../assets/datas/live-comment-defaults.ts";
import type { LiveCommentMapping } from "./api/live-comment-settings.ts";

const defaults: LiveCommentDefaultMapping[] = [
  { channel: "27", assignments: [{ source: "nx-jikkyo", channelId: "jk1" }] },
  { channel: "26", assignments: [{ source: "nx-jikkyo", channelId: "jk2" }] },
  { channel: "BS15_0", assignments: [{ source: "nx-jikkyo", channelId: "jk101" }] },
];

function mappingOf(overrides: Partial<LiveCommentMapping>): LiveCommentMapping {
  return {
    id: "x",
    channel: "27",
    assignments: [{ source: "nicolive", channelId: "ch1" }],
    enabled: false,
    createdAt: 0,
    ...overrides,
  };
}

describe("planDefaultApply", () => {
  it("未登録チャンネルは add、登録済みは update に振り分ける", () => {
    const existing = new Set(["27", "26", "BS15_0"]);
    const current = [mappingOf({ id: "a", channel: "27" })];
    const plan = planDefaultApply(defaults, existing, current);

    // 27 は登録済み → update、26 / BS15_0 は新規 → add
    expect(plan.updates).toEqual([
      {
        id: "a",
        input: {
          channel: "27",
          assignments: [{ source: "nx-jikkyo", channelId: "jk1" }],
          enabled: true,
        },
      },
    ]);
    expect(plan.adds.map((a) => a.channel)).toEqual(["26", "BS15_0"]);
    expect(plan.skipped).toEqual([]);
  });

  it("mirakc に存在しない channel は skip する", () => {
    // BS15_0 は存在しない (BS 未設定)
    const existing = new Set(["27", "26"]);
    const plan = planDefaultApply(defaults, existing, []);
    expect(plan.adds.map((a) => a.channel)).toEqual(["27", "26"]);
    expect(plan.skipped).toEqual(["BS15_0"]);
  });

  it("上書きは enabled を true にする", () => {
    const existing = new Set(["27"]);
    const current = [mappingOf({ id: "a", channel: "27", enabled: false })];
    const plan = planDefaultApply([defaults[0]], existing, current);
    expect(plan.updates[0].input.enabled).toBe(true);
  });

  it("assignments はコピーする (データの配列を共有しない)", () => {
    const existing = new Set(["27"]);
    const plan = planDefaultApply([defaults[0]], existing, []);
    expect(plan.adds[0].assignments).not.toBe(defaults[0].assignments);
    expect(plan.adds[0].assignments).toEqual(defaults[0].assignments);
  });
});
