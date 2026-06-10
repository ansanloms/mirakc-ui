import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import Modal from "./Modal.tsx";

describe("Modal", () => {
  it("open=true で children と閉じるボタンを描画する", () => {
    render(
      <Modal open onClose={() => {}}>
        <p>本文</p>
      </Modal>,
    );
    expect(screen.getByText("本文")).toBeTruthy();
    expect(screen.getByRole("button")).toBeTruthy();
  });

  it("hideClose で閉じるボタンを出さない", () => {
    render(
      <Modal open hideClose onClose={() => {}}>
        <p>本文</p>
      </Modal>,
    );
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("閉じるボタンクリックで onClose が一度だけ発火する", () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose}>
        <p>本文</p>
      </Modal>,
    );
    screen.getByRole("button").click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
