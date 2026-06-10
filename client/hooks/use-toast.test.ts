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

  it("show でトーストが出て duration 経過後に消える", () => {
    const { result } = renderHook(() => useToast(3000));
    expect(result.current.toast).toBeNull();

    act(() => {
      result.current.show("保存しました", "success");
    });
    expect(result.current.toast).toEqual({
      message: "保存しました",
      variant: "success",
    });

    act(() => {
      vi.advanceTimersByTime(2999);
    });
    expect(result.current.toast).not.toBeNull();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.toast).toBeNull();
  });

  it("連続 show は上書きしタイマーをリセットする", () => {
    const { result } = renderHook(() => useToast(3000));

    act(() => {
      result.current.show("1 回目", "success");
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    act(() => {
      result.current.show("2 回目", "error");
    });
    // 1 回目のタイマー残り (1000ms) では消えない。
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current.toast).toEqual({
      message: "2 回目",
      variant: "error",
    });

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current.toast).toBeNull();
  });
});
