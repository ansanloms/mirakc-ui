import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useNow } from "./use-now.ts";

describe("useNow", () => {
  it("初期値は getNow の戻り値を返す", () => {
    const { result } = renderHook(() => useNow(30_000, () => 1000));
    expect(result.current).toBe(1000);
  });

  it("intervalMs ごとに getNow を再評価して値を進める", () => {
    vi.useFakeTimers();
    try {
      let t = 1000;
      const getNow = () => t;
      const { result } = renderHook(() => useNow(30_000, getNow));
      expect(result.current).toBe(1000);

      t = 31_000;
      act(() => {
        vi.advanceTimersByTime(30_000);
      });
      expect(result.current).toBe(31_000);

      t = 61_000;
      act(() => {
        vi.advanceTimersByTime(30_000);
      });
      expect(result.current).toBe(61_000);
    } finally {
      vi.useRealTimers();
    }
  });

  it("intervalMs 未満では値を更新しない", () => {
    vi.useFakeTimers();
    try {
      let t = 1000;
      const { result } = renderHook(() => useNow(30_000, () => t));
      t = 5000;
      act(() => {
        vi.advanceTimersByTime(29_999);
      });
      expect(result.current).toBe(1000);
    } finally {
      vi.useRealTimers();
    }
  });

  it("unmount 後は interval が止まり getNow を呼ばない", () => {
    vi.useFakeTimers();
    try {
      const getNow = vi.fn(() => 1000);
      const { unmount } = renderHook(() => useNow(30_000, getNow));
      const callsAtMount = getNow.mock.calls.length;
      unmount();
      act(() => {
        vi.advanceTimersByTime(120_000);
      });
      expect(getNow.mock.calls.length).toBe(callsAtMount);
    } finally {
      vi.useRealTimers();
    }
  });
});
