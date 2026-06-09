import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useDebouncedValue } from "./use-debounced-value.ts";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useDebouncedValue", () => {
  it("初期値を即座に返す", () => {
    const { result } = renderHook(() => useDebouncedValue("a", 200));
    expect(result.current).toBe("a");
  });

  it("delay 経過後に新しい値へ更新する", () => {
    const { result, rerender } = renderHook(
      ({ v }) => useDebouncedValue(v, 200),
      { initialProps: { v: "a" } },
    );
    rerender({ v: "b" });
    // まだ反映されない。
    expect(result.current).toBe("a");
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toBe("b");
  });

  it("delay 内の連続変更は最後の値だけ反映する", () => {
    const { result, rerender } = renderHook(
      ({ v }) => useDebouncedValue(v, 200),
      { initialProps: { v: "a" } },
    );
    rerender({ v: "b" });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    // b のタイマは未確定のまま c に置き換わる。
    rerender({ v: "c" });
    act(() => {
      vi.advanceTimersByTime(100);
    });
    // c のタイマはまだ 100ms しか経っていない (b は破棄済み)。
    expect(result.current).toBe("a");
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe("c");
  });
});
