import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import InfoTab from "./InfoTab.tsx";
import { buildSamplePrograms, sampleServices } from "../../../lib/fixtures.ts";
import { formatMd, formatWeekday } from "../../../lib/datetime.ts";
import { t } from "../../../locales/i18n.ts";

const base = 1736900000000;
const programs = buildSamplePrograms(base);
const program = programs[0];
const service = sampleServices[0];

describe("InfoTab", () => {
  it("番組タイトルとチャンネル名を描画する", () => {
    render(<InfoTab program={program} service={service} />);
    expect(screen.getByText(program.name!)).toBeTruthy();
    expect(screen.getByText(service.name!)).toBeTruthy();
  });

  it("日付ラベル (M/d(曜)) を描画する", () => {
    render(<InfoTab program={program} service={service} />);
    const dateLabel = `${formatMd(program.startAt)}(${
      formatWeekday(program.startAt)
    })`;
    // 日付ラベルは時刻と同じ span 内に隣接するため部分一致で確認する。
    expect(screen.getByText(dateLabel, { exact: false })).toBeTruthy();
  });

  it("分数を描画する", () => {
    render(<InfoTab program={program} service={service} />);
    const durationMin = Math.round(program.duration / 60000);
    expect(screen.getByText(`${durationMin}分`)).toBeTruthy();
  });

  it("番組内容 (description) と見出しを描画する", () => {
    render(<InfoTab program={program} service={service} />);
    expect(screen.getByText(t("watch.info.content"))).toBeTruthy();
    expect(screen.getByText(program.description!)).toBeTruthy();
  });

  it("詳細情報の見出しを描画する", () => {
    render(<InfoTab program={program} service={service} />);
    expect(screen.getByText(t("watch.info.extended"))).toBeTruthy();
  });
});
