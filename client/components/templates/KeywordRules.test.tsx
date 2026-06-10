import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import KeywordRulesTemplate from "./KeywordRules.tsx";
import type { KeywordRule } from "../../../server/lib/keyword-rules.ts";
import { buildSamplePrograms, sampleServices } from "../../lib/fixtures.ts";
import { t } from "../../locales/i18n.ts";

const now = Date.UTC(2026, 5, 10, 12, 0, 0);
const programs = buildSamplePrograms(now + 60 * 60 * 1000);

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

function setup(
  override: Partial<Parameters<typeof KeywordRulesTemplate>[0]> = {},
) {
  const props = {
    rules: [ruleOf(), ruleOf({ id: "b", keyword: "映画", enabled: false })],
    services: sampleServices,
    programs,
    currentEpochMs: now,
    onAdd: vi.fn(),
    onEdit: vi.fn(),
    onToggle: vi.fn(),
    onRemove: vi.fn(),
    onBack: vi.fn(),
    ...override,
  };
  return { ...render(<KeywordRulesTemplate {...props} />), props };
}

describe("KeywordRules template", () => {
  it("ヘッダに登録数・有効数・一致番組数の集計を出す", () => {
    setup();
    // ニュース (有効) は ニュース７ / BSニュース の 2 番組に一致。映画は停止中。
    expect(
      screen.getByText(
        t("keyword.head.summary", { total: 2, enabled: 1, matches: 2 }),
      ),
    ).toBeTruthy();
  });

  it("各ルールのカードを描画する", () => {
    setup();
    expect(screen.getByText("「ニュース」")).toBeTruthy();
    expect(screen.getByText("「映画」")).toBeTruthy();
    expect(
      screen.getByText(t("keyword.card.matches", { count: 2 })),
    ).toBeTruthy();
  });

  it("ルールが無ければ空状態を出し、登録ボタンで onAdd が発火する", () => {
    const { props } = setup({ rules: [] });
    expect(screen.getByText(t("keyword.empty.title"))).toBeTruthy();

    fireEvent.click(screen.getByText(t("keyword.add")));
    expect(props.onAdd).toHaveBeenCalledTimes(1);
  });

  it("登録ボタンで onAdd が発火する (新規モーダルは子ルートが描画)", () => {
    const { props } = setup();
    fireEvent.click(screen.getByText(t("keyword.add")));
    expect(props.onAdd).toHaveBeenCalledTimes(1);
  });

  it("編集ボタンで onEdit にルールが渡る", () => {
    const { props } = setup();
    fireEvent.click(screen.getAllByLabelText(t("keyword.card.edit"))[0]);
    expect(props.onEdit).toHaveBeenCalledWith(props.rules[0]);
  });

  it("トグル・削除がルール付きで発火する", () => {
    const { props } = setup();
    fireEvent.click(screen.getAllByRole("switch")[0]);
    expect(props.onToggle).toHaveBeenCalledWith(props.rules[0]);

    fireEvent.click(screen.getAllByLabelText(t("keyword.card.remove"))[0]);
    fireEvent.click(screen.getByText(t("keyword.card.confirmRemove")));
    expect(props.onRemove).toHaveBeenCalledWith(props.rules[0]);
  });

  it("children (モーダル用スロット) を描画する", () => {
    setup({ children: <div data-testid="modal-slot">modal</div> });
    expect(screen.getByTestId("modal-slot")).toBeTruthy();
  });

  it("番組表へ戻るリンクで onBack が発火する", () => {
    const { props } = setup();
    fireEvent.click(screen.getByText(t("keyword.toolbar.epg")));
    expect(props.onBack).toHaveBeenCalledTimes(1);
  });
});
