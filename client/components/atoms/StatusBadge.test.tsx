import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import StatusBadge from "./StatusBadge.tsx";
import { t } from "../../locales/i18n.ts";

describe("StatusBadge", () => {
  it("live は固定で LIVE と表示する", () => {
    render(<StatusBadge kind="live" />);
    expect(screen.getByText("LIVE")).toBeTruthy();
  });

  it("new は対応する翻訳ラベルを表示する", () => {
    render(<StatusBadge kind="new" />);
    expect(screen.getByText(t("program.badge.new"))).toBeTruthy();
  });
});
