import { describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import Watch from "./Watch.tsx";

// Watch -> WatchPlayer は `import("mpegts.js")` を持つ。mpegts.js は
// vitest.config.ts の test.alias でローカルスタブに解決させる。加えて streamUrl を
// 未指定にして Player を placeholder 経路で描画し、実行時の動的 import も走らせ
// ない (Watch は loadMpegts/loadAribb24 を Player に素通ししないため)。
import type { ChannelEntry } from "../organisms/Watch/SelectTab.tsx";
import { renderWithRouter } from "../../lib/test-router.tsx";
import { t } from "../../locales/i18n.ts";
import { samplePrograms, sampleServices } from "../../lib/fixtures.ts";

// Watch template は WatchPlayer に loadMpegts/loadAribb24 を素通ししない。
// そのため streamUrl を未指定にして Player を placeholder 経路で描画し、
// 動的 import (esm.sh の mpegts.js) が走らないようにする。
const channels: ChannelEntry[] = [
  {
    service: sampleServices[0],
    program: samplePrograms[0],
    progress: 0.3,
  },
];

function setup(
  overrides: Partial<Parameters<typeof Watch>[0]> = {},
) {
  const onChangeTab = vi.fn();
  const result = renderWithRouter(
    <Watch
      streamUrl={undefined}
      audioTrackIndex={0}
      onAudioTrackChange={() => {}}
      audios={[]}
      quality="720p"
      onQualityChange={() => {}}
      captionVisible
      onCaptionToggle={() => {}}
      serviceSelectedAt={0}
      channelType="GR"
      onChangeChannelType={() => {}}
      channels={channels}
      onSelectService={() => {}}
      tab="select"
      onChangeTab={onChangeTab}
      comments={[]}
      liveConnected={false}
      onPostComment={() => {}}
      {...overrides}
    />,
  );
  return { onChangeTab, ...result };
}

describe("Watch template", () => {
  it("戻るリンクと右パネルのタブを描画する", async () => {
    setup();
    expect(await screen.findByText(t("watch.back"))).toBeTruthy();
    expect(
      screen.getByRole("button", { name: t("watch.tab.select") }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: t("watch.tab.info") }),
    ).toBeTruthy();
  });

  it("streamUrl 未指定なら Player は placeholder を出す (esm.sh を読まない)", async () => {
    setup();
    expect(
      await screen.findByText(t("watch.selectService")),
    ).toBeTruthy();
  });

  it("select タブの内容 (放送局名) が描画される", async () => {
    setup();
    expect(await screen.findByText("NHK総合")).toBeTruthy();
  });

  it("右パネルのタブクリックで onChangeTab が発火する", async () => {
    const { onChangeTab } = setup();
    fireEvent.click(
      await screen.findByRole("button", { name: t("watch.tab.info") }),
    );
    expect(onChangeTab).toHaveBeenCalledWith("info");
  });
});
