import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import RuleCard from "./RuleCard.tsx";
import type { KeywordRule } from "../../../lib/api/keyword-rules.ts";
import { sampleServices } from "../../../lib/fixtures.ts";
import { t } from "../../../locales/i18n.ts";

function ruleOf(overrides: Partial<KeywordRule> = {}): KeywordRule {
  return {
    id: "a",
    keyword: "ニュース",
    serviceIds: [],
    genres: [],
    enabled: true,
    createdAt: 0,
    ...overrides,
  };
}

function setup(override: Partial<Parameters<typeof RuleCard>[0]> = {}) {
  const props = {
    rule: ruleOf(),
    services: sampleServices,
    matchCount: 3,
    onToggle: vi.fn(),
    onEdit: vi.fn(),
    onRemove: vi.fn(),
    ...override,
  };
  return { ...render(<RuleCard {...props} />), props };
}

describe("RuleCard", () => {
  it("キーワードと一致件数を表示する", () => {
    setup();
    expect(screen.getByText("「ニュース」")).toBeTruthy();
    expect(
      screen.getByText(t("keyword.card.matches", { count: 3 })),
    ).toBeTruthy();
  });

  it("停止中は off ピルを出し一致件数を出さない", () => {
    setup({ rule: ruleOf({ enabled: false }) });
    expect(screen.getByText(t("keyword.card.off"))).toBeTruthy();
    expect(
      screen.queryByText(t("keyword.card.matches", { count: 3 })),
    ).toBeNull();
  });

  it("条件なしの場合は案内文を出す", () => {
    setup();
    expect(screen.getByText(t("keyword.card.conditionNone"))).toBeTruthy();
  });

  it("期間・チャンネル・ジャンルの条件チップを出す", () => {
    setup({
      rule: ruleOf({
        from: "2026-01-01",
        to: "2026-01-31",
        serviceIds: [3273601024],
        genres: [0],
      }),
    });
    // リテラルで検証する: t() 同士の比較だと interpolation の HTML エスケープ
    // ("/" → &#x2F;) が双方に掛かって化けを検出できない。
    expect(screen.getByText("1/1 〜 1/31")).toBeTruthy();
    expect(screen.getByText("NHK総合")).toBeTruthy();
    expect(screen.getByText(t("genre.news"))).toBeTruthy();
  });

  it("複数チャンネルは件数表記にする", () => {
    setup({ rule: ruleOf({ serviceIds: [3273601024, 3273701032] }) });
    expect(
      screen.getByText(t("keyword.card.channels", { count: 2 })),
    ).toBeTruthy();
  });

  it("スイッチで onToggle が発火する", () => {
    const { props } = setup();
    fireEvent.click(screen.getByRole("switch"));
    expect(props.onToggle).toHaveBeenCalledTimes(1);
  });

  it("編集ボタンで onEdit が発火する", () => {
    const { props } = setup();
    fireEvent.click(screen.getByLabelText(t("keyword.card.edit")));
    expect(props.onEdit).toHaveBeenCalledTimes(1);
  });

  it("削除はインライン確認を経て onRemove が発火する", () => {
    const { props } = setup();
    fireEvent.click(screen.getByLabelText(t("keyword.card.remove")));
    expect(screen.getByText(t("keyword.card.confirm"))).toBeTruthy();
    expect(props.onRemove).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText(t("keyword.card.confirmRemove")));
    expect(props.onRemove).toHaveBeenCalledTimes(1);
  });

  it("削除確認は取消で戻せる", () => {
    const { props } = setup();
    fireEvent.click(screen.getByLabelText(t("keyword.card.remove")));
    fireEvent.click(screen.getByText(t("keyword.card.confirmCancel")));
    expect(screen.queryByText(t("keyword.card.confirm"))).toBeNull();
    expect(props.onRemove).not.toHaveBeenCalled();
  });
});
