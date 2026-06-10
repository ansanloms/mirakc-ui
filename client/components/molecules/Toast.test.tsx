import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Toast from "./Toast.tsx";

describe("Toast", () => {
  it("メッセージを role=status で表示する", () => {
    render(<Toast message="保存しました" variant="success" />);
    const toast = screen.getByRole("status");
    expect(toast.textContent).toContain("保存しました");
  });

  it("variant でクラスが変わる", () => {
    const success = render(<Toast message="ok" variant="success" />);
    const successClass = success.getByRole("status").className;
    success.unmount();

    const error = render(<Toast message="ng" variant="error" />);
    const errorClass = error.getByRole("status").className;

    expect(errorClass).not.toBe(successClass);
  });

  it("leaving で退場アニメーションのクラスが付く", () => {
    const normal = render(<Toast message="ok" variant="success" />);
    const normalClass = normal.getByRole("status").className;
    normal.unmount();

    const leaving = render(<Toast message="ok" variant="success" leaving />);
    const leavingClass = leaving.getByRole("status").className;

    expect(leavingClass).not.toBe(normalClass);
    expect(leavingClass.length).toBeGreaterThan(normalClass.length);
  });
});
