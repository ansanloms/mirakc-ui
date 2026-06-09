import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { formatHotkey, useHotkey } from "./use-hotkey.ts";

/** keydown を組み立てて dispatch し、その KeyboardEvent を返す（defaultPrevented 検証用）。 */
function press(
  init: KeyboardEventInit & { key: string },
  target: EventTarget = globalThis,
): KeyboardEvent {
  const ev = new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(ev);
  return ev;
}

describe("useHotkey", () => {
  it("非 Mac では mod+k を Ctrl+K として拾い preventDefault する", () => {
    const handler = vi.fn();
    renderHook(() => useHotkey("mod+k", handler, { isMac: false }));
    const ev = press({ key: "k", ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(ev.defaultPrevented).toBe(true);
  });

  it("Mac では mod+k を Cmd+K として拾い、Ctrl+K では発火しない", () => {
    const handler = vi.fn();
    renderHook(() => useHotkey("mod+k", handler, { isMac: true }));
    press({ key: "k", ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();
    press({ key: "k", metaKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("キーが違えば発火しない", () => {
    const handler = vi.fn();
    renderHook(() => useHotkey("mod+k", handler, { isMac: false }));
    press({ key: "j", ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();
  });

  it("余分な修飾子が付くと発火しない（厳密一致）", () => {
    const handler = vi.fn();
    renderHook(() => useHotkey("ctrl+k", handler));
    press({ key: "k", ctrlKey: true, shiftKey: true });
    expect(handler).not.toHaveBeenCalled();
    press({ key: "k", ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("enabled=false なら発火しない", () => {
    const handler = vi.fn();
    renderHook(() => useHotkey("ctrl+k", handler, { enabled: false }));
    press({ key: "k", ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();
  });

  it("preventDefault=false なら既定動作を止めない", () => {
    const handler = vi.fn();
    renderHook(() => useHotkey("ctrl+k", handler, { preventDefault: false }));
    const ev = press({ key: "k", ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(ev.defaultPrevented).toBe(false);
  });

  it("allowInInput=false なら入力要素フォーカス中は発火しない", () => {
    const handler = vi.fn();
    renderHook(() => useHotkey("ctrl+k", handler, { allowInInput: false }));
    const input = document.createElement("input");
    document.body.appendChild(input);
    try {
      press({ key: "k", ctrlKey: true }, input);
      expect(handler).not.toHaveBeenCalled();
      // 入力要素の外なら発火する。
      press({ key: "k", ctrlKey: true });
      expect(handler).toHaveBeenCalledTimes(1);
    } finally {
      input.remove();
    }
  });

  it("unmount でリスナを解除する", () => {
    const handler = vi.fn();
    const { unmount } = renderHook(() => useHotkey("ctrl+k", handler));
    unmount();
    press({ key: "k", ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();
  });
});

describe("formatHotkey", () => {
  it("非 Mac は Ctrl+K 表記", () => {
    expect(formatHotkey("mod+k", false)).toBe("Ctrl+K");
  });

  it("Mac は ⌘K 表記（区切りなし）", () => {
    expect(formatHotkey("mod+k", true)).toBe("⌘K");
  });

  it("複合修飾子を並べる（非 Mac）", () => {
    expect(formatHotkey("ctrl+shift+k", false)).toBe("Ctrl+Shift+K");
  });

  it("名前付きキーを整形する", () => {
    expect(formatHotkey("escape", false)).toBe("Esc");
  });
});
