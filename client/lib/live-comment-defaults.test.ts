import { describe, expect, it } from "vitest";
import { planDefaultApply } from "./live-comment-defaults.ts";
import type { LiveCommentDefaultMapping } from "../assets/datas/live-comment-defaults.ts";

const defaults: LiveCommentDefaultMapping[] = [
  { channel: "27", assignments: [{ source: "nx-jikkyo", channelId: "jk1" }] },
  { channel: "26", assignments: [{ source: "nx-jikkyo", channelId: "jk2" }] },
  {
    channel: "BS15_0",
    assignments: [{ source: "nx-jikkyo", channelId: "jk101" }],
  },
];

describe("planDefaultApply", () => {
  it("mirakc に存在する channel をすべて追加対象にする", () => {
    const existing = new Set(["27", "26", "BS15_0"]);
    const plan = planDefaultApply(defaults, existing);
    expect(plan.adds.map((a) => a.channel)).toEqual(["27", "26", "BS15_0"]);
    expect(plan.skipped).toEqual([]);
  });

  it("既存の設定は見ず、常に新規追加する (上書きしない)", () => {
    // 27 が既に登録済みでも、デフォルトは別エントリとして add する。
    const existing = new Set(["27"]);
    const plan = planDefaultApply([defaults[0]], existing);
    expect(plan.adds).toEqual([
      {
        channel: "27",
        assignments: [{ source: "nx-jikkyo", channelId: "jk1" }],
        enabled: true,
      },
    ]);
  });

  it("mirakc に存在しない channel は skip する", () => {
    // BS15_0 は存在しない (BS 未設定)
    const existing = new Set(["27", "26"]);
    const plan = planDefaultApply(defaults, existing);
    expect(plan.adds.map((a) => a.channel)).toEqual(["27", "26"]);
    expect(plan.skipped).toEqual(["BS15_0"]);
  });

  it("追加は enabled を true にする", () => {
    const plan = planDefaultApply([defaults[0]], new Set(["27"]));
    expect(plan.adds[0].enabled).toBe(true);
  });

  it("assignments はコピーする (データの配列を共有しない)", () => {
    const plan = planDefaultApply([defaults[0]], new Set(["27"]));
    expect(plan.adds[0].assignments).not.toBe(defaults[0].assignments);
    expect(plan.adds[0].assignments).toEqual(defaults[0].assignments);
  });
});
