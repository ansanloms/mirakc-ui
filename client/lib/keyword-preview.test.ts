import { describe, expect, it } from "vitest";
import { buildUpcoming } from "./keyword-preview.ts";
import type { components } from "./api/schema.d.ts";

type Program = components["schemas"]["MirakurunProgram"];
type Service = components["schemas"]["MirakurunService"];

const now = Date.UTC(2026, 5, 10, 12, 0, 0);
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const services = [
  {
    id: 3273601024,
    networkId: 32736,
    serviceId: 1024,
    name: "テレビA",
    type: 1,
    hasLogoData: false,
    channel: { type: "GR", channel: "27" },
  },
] as Service[];

function program(overrides: Partial<Program>): Program {
  return {
    id: 1,
    eventId: 1,
    networkId: 32736,
    serviceId: 1024,
    startAt: now + HOUR,
    duration: HOUR,
    isFree: true,
    name: "番組",
    genres: [{ lv1: 0, lv2: 0, un1: 0, un2: 0 }],
    ...overrides,
  } as Program;
}

describe("buildUpcoming", () => {
  it("終了済み・7日窓の外・名前なしの番組を除外し開始順に並べる", () => {
    const upcoming = buildUpcoming(
      [
        program({ id: 1, startAt: now + 2 * HOUR, name: "あと" }),
        program({ id: 2, startAt: now + HOUR, name: "さき" }),
        // 放送中 (開始は過去だが未終了) は含む。
        program({
          id: 3,
          startAt: now - HOUR,
          duration: 2 * HOUR,
          name: "放送中",
        }),
        // 終了済み。
        program({ id: 4, startAt: now - 2 * HOUR, duration: HOUR }),
        // 8 日後。
        program({ id: 5, startAt: now + 8 * DAY }),
        // 名前なし。
        program({ id: 6, name: null }),
      ],
      services,
      now,
    );

    expect(upcoming.map((e) => e.program.id)).toEqual([3, 2, 1]);
  });

  it("service と target (channelId / genres lv1) を解決する", () => {
    const [entry] = buildUpcoming([program({ id: 1 })], services, now);
    expect(entry.service?.name).toBe("テレビA");
    expect(entry.target).toEqual({
      name: "番組",
      startAt: now + HOUR,
      channelId: "27",
      genres: [0],
    });
  });
});
