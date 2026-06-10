import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import RuleFormModal from "./RuleFormModal.tsx";
import type { KeywordRule } from "../../../../server/lib/keyword-rules.ts";
import { buildUpcoming } from "../../../lib/keyword-preview.ts";
import { buildSamplePrograms, sampleServices } from "../../../lib/fixtures.ts";
import { t } from "../../../locales/i18n.ts";

const now = Date.UTC(2026, 5, 10, 12, 0, 0);
// fixtures は base-30分 起点で番組を組む。全番組が未来になるよう base を未来へ。
const programs = buildSamplePrograms(now + 60 * 60 * 1000);
const upcoming = buildUpcoming(programs, sampleServices, now);

function setup(override: Partial<Parameters<typeof RuleFormModal>[0]> = {}) {
  const props = {
    open: true,
    services: sampleServices,
    upcoming,
    onSave: vi.fn(),
    onClose: vi.fn(),
    ...override,
  };
  return { ...render(<RuleFormModal {...props} />), props };
}

function keywordInput() {
  return screen.getByPlaceholderText<HTMLInputElement>(
    t("keyword.modal.keywordPlaceholder"),
  );
}

function saveButton() {
  return screen.getByText(t("keyword.modal.save")).closest("button")!;
}

function submit(container: HTMLElement) {
  fireEvent.submit(container.querySelector("form")!);
}

describe("RuleFormModal", () => {
  it("新規: キーワードが空なら保存できずプレビューは案内文", () => {
    setup();
    expect(screen.getByText(t("keyword.modal.titleNew"))).toBeTruthy();
    expect(saveButton().disabled).toBe(true);
    expect(
      screen.getByText(t("keyword.modal.preview.noKeyword")),
    ).toBeTruthy();
  });

  it("キーワード入力で一致プレビューが出る", () => {
    setup();
    fireEvent.change(keywordInput(), { target: { value: "ニュース" } });

    // ニュース７ (GR) と BSニュース (BS) が一致する。
    expect(screen.getByText("ニュース７")).toBeTruthy();
    expect(screen.getByText("BSニュース")).toBeTruthy();
    expect(
      screen.getByText(t("keyword.modal.preview.count", { count: 2 })),
    ).toBeTruthy();
    expect(saveButton().disabled).toBe(false);
  });

  it("一致しないキーワードは noMatch を出す", () => {
    setup();
    fireEvent.change(keywordInput(), { target: { value: "存在しない番組" } });
    expect(screen.getByText(t("keyword.modal.preview.noMatch"))).toBeTruthy();
  });

  it("チャンネル選択でプレビューが絞られる", () => {
    setup();
    fireEvent.change(keywordInput(), { target: { value: "ニュース" } });
    // BS NHK のみ選択。
    fireEvent.click(screen.getByText("BS NHK"));

    expect(screen.queryByText("ニュース７")).toBeNull();
    expect(screen.getByText("BSニュース")).toBeTruthy();
  });

  it("ジャンル選択でプレビューが絞られる", () => {
    setup();
    fireEvent.change(keywordInput(), { target: { value: "中継" } });
    // サッカー中継 (lv1=1 スポーツ)。報道 (lv1=0) を選ぶと外れる。
    expect(screen.getByText("サッカー中継")).toBeTruthy();
    fireEvent.click(screen.getByText(t("genre.news")));
    expect(screen.queryByText("サッカー中継")).toBeNull();
  });

  it("期間が開始 > 終了ならエラーを出し保存できない", () => {
    setup();
    fireEvent.change(keywordInput(), { target: { value: "ニュース" } });
    fireEvent.change(screen.getByLabelText(t("keyword.modal.from")), {
      target: { value: "2026-06-20" },
    });
    fireEvent.change(screen.getByLabelText(t("keyword.modal.to")), {
      target: { value: "2026-06-10" },
    });

    expect(screen.getByText(t("keyword.modal.periodError"))).toBeTruthy();
    expect(saveButton().disabled).toBe(true);
  });

  it("送信で正規化済みの入力を onSave に渡す", () => {
    const { props, container } = setup();
    fireEvent.change(keywordInput(), { target: { value: "  ニュース  " } });
    fireEvent.click(screen.getByText("NHK総合"));
    fireEvent.click(screen.getByText(t("genre.news")));
    submit(container);

    expect(props.onSave).toHaveBeenCalledWith({
      keyword: "ニュース",
      from: undefined,
      to: undefined,
      serviceIds: [3273601024],
      genres: [0],
      enabled: true,
    });
  });

  it("編集: 既存値をプリフィルし enabled を維持する", () => {
    const initial: KeywordRule = {
      id: "a",
      keyword: "ドラマ",
      from: "2026-06-01",
      to: "2026-06-30",
      serviceIds: [3273601024],
      genres: [3],
      enabled: false,
      createdAt: 0,
    };
    const { props, container } = setup({ initial });

    expect(screen.getByText(t("keyword.modal.titleEdit"))).toBeTruthy();
    expect(keywordInput().value).toBe("ドラマ");
    expect(screen.getByText(t("keyword.modal.saveEdit"))).toBeTruthy();

    submit(container);
    expect(props.onSave).toHaveBeenCalledWith({
      keyword: "ドラマ",
      from: "2026-06-01",
      to: "2026-06-30",
      serviceIds: [3273601024],
      genres: [3],
      enabled: false,
    });
  });
});
