import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import ChannelTypeTabList from "./ChannelTypeTabList.tsx";
import { CHANNEL_TYPES, channelTypeLabel } from "../../../lib/service.ts";

describe("ChannelTypeTabList", () => {
  it("全 channel type のタブを描画する", () => {
    render(
      <ChannelTypeTabList channelType="GR" onChangeChannelType={() => {}} />,
    );
    for (const id of CHANNEL_TYPES) {
      expect(screen.getByText(channelTypeLabel(id))).toBeTruthy();
    }
  });

  it("別 channel type のタブをクリックすると onChangeChannelType が発火する", () => {
    const onChangeChannelType = vi.fn();
    render(
      <ChannelTypeTabList
        channelType="GR"
        onChangeChannelType={onChangeChannelType}
      />,
    );
    fireEvent.click(screen.getByText(channelTypeLabel("BS")));
    expect(onChangeChannelType).toHaveBeenCalledTimes(1);
    expect(onChangeChannelType).toHaveBeenCalledWith("BS");
  });

  it("選択中の channel type だけアクティブクラスが付く", () => {
    render(
      <ChannelTypeTabList channelType="GR" onChangeChannelType={() => {}} />,
    );
    // 同一描画内で選択中 (GR) と非選択 (BS) のクラス文字列が異なる。
    expect(screen.getByText(channelTypeLabel("GR")).className).not.toBe(
      screen.getByText(channelTypeLabel("BS")).className,
    );
  });
});
