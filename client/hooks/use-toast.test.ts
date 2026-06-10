import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useToast } from "./use-toast.ts";

describe("useToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("show でトーストが出て duration 経過で leaving、退場後に消える", () => {
    const { result } = renderHook(() => useToast(3000, 200));
    expect(result.current.toast).toBeNull();

    act(() => {
      result.current.show("保存しました", "success");
    });
    expect(result.current.toast).toEqual({
      message: "保存しました",
      variant: "success",
      leaving: false,
    });

    // duration 経過直前までは表示中。
    act(() => {
      vi.advanceTimersByTime(2999);
    });
    expect(result.current.toast?.leaving).toBe(false);

    // duration 経過で退場アニメーションへ (まだ描画されている)。
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.toast?.leaving).toBe(true);

    // 退場時間が過ぎたらアンマウント。
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.toast).toBeNull();
  });

  it("連続 show は上書きしタイマーをリセットする", () => {
    const { result } = renderHook(() => useToast(3000, 200));

    act(() => {
      result.current.show("1 回目", "success");
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    act(() => {
      result.current.show("2 回目", "error");
    });
    // 1 回目のタイマー残り (1000ms) では leaving にならない。
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current.toast).toEqual({
      message: "2 回目",
      variant: "error",
      leaving: false,
    });

    act(() => {
      vi.advanceTimersByTime(1500 + 200);
    });
    expect(result.current.toast).toBeNull();
  });
});
