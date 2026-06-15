import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import MappingCard from "./MappingCard.tsx";
import type { LiveCommentMapping } from "../../../lib/api/live-comment-settings.ts";
import { sampleChannelGroups } from "../../../lib/fixtures.ts";
import { commentSourceLabel } from "../../../lib/comment-source.ts";
import { t } from "../../../locales/i18n.ts";

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

function setup(override: Partial<Parameters<typeof MappingCard>[0]> = {}) {
  const props = {
    mapping: mappingOf(),
    channel: sampleChannelGroups.find((c) => c.id === "27"),
    onToggle: vi.fn(),
    onEdit: vi.fn(),
    onRemove: vi.fn(),
    ...override,
  };
  return { ...render(<MappingCard {...props} />), props };
}

describe("MappingCard", () => {
  it("チャンネル名と取得元ごとの実況 ID を表示する", () => {
    setup({
      mapping: mappingOf({
        assignments: [
          { source: "nicolive", channelId: "ch2646436" },
          { source: "nx-jikkyo", channelId: "jk1" },
        ],
      }),
    });
    expect(screen.getByText("NHK総合")).toBeTruthy();
    expect(screen.getByText("ch2646436")).toBeTruthy();
    expect(screen.getByText("jk1")).toBeTruthy();
    expect(screen.getByText(commentSourceLabel("nicolive"))).toBeTruthy();
    expect(screen.getByText(commentSourceLabel("nx-jikkyo"))).toBeTruthy();
  });

  it("channel が解決できなければ channel 文字列を出す", () => {
    setup({ channel: undefined, mapping: mappingOf({ channel: "BS9_1" }) });
    expect(screen.getByText("BS9_1")).toBeTruthy();
  });

  it("停止中は off ピルを出す", () => {
    setup({ mapping: mappingOf({ enabled: false }) });
    expect(screen.getByText(t("liveComment.card.off"))).toBeTruthy();
  });

  it("割り当てが無ければ案内文を出す", () => {
    setup({ mapping: mappingOf({ assignments: [] }) });
    expect(screen.getByText(t("liveComment.card.noAssignments"))).toBeTruthy();
  });

  it("スイッチで onToggle が発火する", () => {
    const { props } = setup();
    fireEvent.click(screen.getByRole("switch"));
    expect(props.onToggle).toHaveBeenCalledTimes(1);
  });

  it("編集ボタンで onEdit が発火する", () => {
    const { props } = setup();
    fireEvent.click(screen.getByLabelText(t("liveComment.card.edit")));
    expect(props.onEdit).toHaveBeenCalledTimes(1);
  });

  it("削除はインライン確認を経て onRemove が発火する", () => {
    const { props } = setup();
    fireEvent.click(screen.getByLabelText(t("liveComment.card.remove")));
    expect(screen.getByText(t("liveComment.card.confirm"))).toBeTruthy();
    expect(props.onRemove).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText(t("liveComment.card.confirmRemove")));
    expect(props.onRemove).toHaveBeenCalledTimes(1);
  });

  it("削除確認は取消で戻せる", () => {
    const { props } = setup();
    fireEvent.click(screen.getByLabelText(t("liveComment.card.remove")));
    fireEvent.click(screen.getByText(t("liveComment.card.confirmCancel")));
    expect(screen.queryByText(t("liveComment.card.confirm"))).toBeNull();
    expect(props.onRemove).not.toHaveBeenCalled();
  });
});
