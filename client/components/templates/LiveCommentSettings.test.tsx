import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import LiveCommentSettingsTemplate from "./LiveCommentSettings.tsx";
import type { LiveCommentMapping } from "../../lib/api/live-comment-settings.ts";
import { sampleChannelGroups } from "../../lib/fixtures.ts";
import { t } from "../../locales/i18n.ts";

function mappingOf(
  overrides: Partial<LiveCommentMapping> = {},
): LiveCommentMapping {
  return {
    id: "a",
    channel: "27",
    assignments: [{ source: "nx-jikkyo", channelId: "jk1" }],
    enabled: true,
    createdAt: 0,
    ...overrides,
  };
}

function setup(
  override: Partial<Parameters<typeof LiveCommentSettingsTemplate>[0]> = {},
) {
  const props = {
    // channel 昇順で並ぶので、index 基準のアサートが崩れないよう昇順で渡す。
    mappings: [
      mappingOf({ id: "a", channel: "26" }),
      mappingOf({ id: "b", channel: "27", enabled: false }),
    ],
    channels: sampleChannelGroups,
    regions: [{ id: "kanto", label: "関東" }],
    onApplyDefaults: vi.fn(),
    onAdd: vi.fn(),
    onEdit: vi.fn(),
    onToggle: vi.fn(),
    onRemove: vi.fn(),
    onBackToSettings: vi.fn(),
    onOpenWatch: vi.fn(),
    onBack: vi.fn(),
    ...override,
  };
  return { ...render(<LiveCommentSettingsTemplate {...props} />), props };
}

describe("LiveCommentSettings template", () => {
  it("ヘッダに登録数・有効数の集計を出す", () => {
    setup();
    expect(
      screen.getByText(t("liveComment.head.summary", { total: 2, enabled: 1 })),
    ).toBeTruthy();
  });

  it("各割り当てのカードを描画する (channel 名で解決)", () => {
    setup();
    expect(screen.getByText("NHK総合")).toBeTruthy();
    expect(screen.getByText("Eテレ")).toBeTruthy();
  });

  it("channel の昇順で表示する", () => {
    setup({
      mappings: [
        mappingOf({ id: "a", channel: "27" }), // NHK総合
        mappingOf({ id: "b", channel: "24" }), // テレビ朝日
        mappingOf({ id: "c", channel: "26" }), // Eテレ
      ],
    });
    // 24 → 26 → 27 の順に並ぶので、テレビ朝日 が NHK総合 より前に来る。
    const asahi = screen.getByText("テレビ朝日");
    const nhk = screen.getByText("NHK総合");
    expect(
      asahi.compareDocumentPosition(nhk) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("割り当てが無ければ空状態を出し、追加ボタンで onAdd が発火する", () => {
    const { props } = setup({ mappings: [] });
    expect(screen.getByText(t("liveComment.empty.title"))).toBeTruthy();
    fireEvent.click(screen.getByText(t("liveComment.add")));
    expect(props.onAdd).toHaveBeenCalledTimes(1);
  });

  it("追加ボタンで onAdd が発火する", () => {
    const { props } = setup();
    fireEvent.click(screen.getByText(t("liveComment.add")));
    expect(props.onAdd).toHaveBeenCalledTimes(1);
  });

  it("デフォルト登録 (確認 → 実行) で onApplyDefaults に地域が渡る", () => {
    const { props } = setup();
    fireEvent.click(screen.getByText(t("liveComment.defaults.button")));
    fireEvent.click(screen.getByText(t("liveComment.defaults.apply")));
    expect(props.onApplyDefaults).toHaveBeenCalledWith("kanto");
  });

  it("編集ボタンで onEdit に割り当てが渡る", () => {
    const { props } = setup();
    fireEvent.click(screen.getAllByLabelText(t("liveComment.card.edit"))[0]);
    expect(props.onEdit).toHaveBeenCalledWith(props.mappings[0]);
  });

  it("トグル・削除が割り当て付きで発火する", () => {
    const { props } = setup();
    fireEvent.click(screen.getAllByRole("switch")[0]);
    expect(props.onToggle).toHaveBeenCalledWith(props.mappings[0]);

    fireEvent.click(screen.getAllByLabelText(t("liveComment.card.remove"))[0]);
    fireEvent.click(screen.getByText(t("liveComment.card.confirmRemove")));
    expect(props.onRemove).toHaveBeenCalledWith(props.mappings[0]);
  });

  it("children (モーダル用スロット) を描画する", () => {
    setup({ children: <div data-testid="modal-slot">modal</div> });
    expect(screen.getByTestId("modal-slot")).toBeTruthy();
  });

  it("番組表へ戻るリンクで onBack が発火する", () => {
    const { props } = setup();
    fireEvent.click(screen.getByLabelText(t("liveComment.toolbar.epg")));
    expect(props.onBack).toHaveBeenCalledTimes(1);
  });

  it("設定へ戻るリンクで onBackToSettings が発火する", () => {
    const { props } = setup();
    fireEvent.click(screen.getByLabelText(t("liveComment.toolbar.settings")));
    expect(props.onBackToSettings).toHaveBeenCalledTimes(1);
  });

  it("視聴画面へのリンクで onOpenWatch が発火する", () => {
    const { props } = setup();
    fireEvent.click(screen.getByLabelText(t("watch.open")));
    expect(props.onOpenWatch).toHaveBeenCalledTimes(1);
  });
});
