import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ChannelRow from "./ChannelRow.tsx";
import { buildSamplePrograms, sampleServices } from "../../../lib/fixtures.ts";
import { t } from "../../../locales/i18n.ts";

const base = 1736900000000;
const programs = buildSamplePrograms(base);
const service = sampleServices[0];
// service[0] (NHK総合) の番組群。
const program = programs[0];
const nextProgram = programs[1];

describe("ChannelRow", () => {
  it("program が無ければ何も描画しない (null)", () => {
    const { container } = render(
      <ChannelRow
        service={service}
        progress={0}
        active={false}
        onSelect={() => {}}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("program があれば service.name / program.name を描画する", () => {
    render(
      <ChannelRow
        service={service}
        program={program}
        progress={0.5}
        active={false}
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText(service.name!)).toBeTruthy();
    expect(screen.getByText(program.name!)).toBeTruthy();
  });

  it("クリックで onSelect が一度だけ発火する", () => {
    const onSelect = vi.fn();
    render(
      <ChannelRow
        service={service}
        program={program}
        progress={0}
        active={false}
        onSelect={onSelect}
      />,
    );
    screen.getByRole("button").click();
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("active で active クラスが付与される", () => {
    const { rerender } = render(
      <ChannelRow
        service={service}
        program={program}
        progress={0}
        active={false}
        onSelect={() => {}}
      />,
    );
    const inactiveClass = screen.getByRole("button").className;

    rerender(
      <ChannelRow
        service={service}
        program={program}
        progress={0}
        active
        onSelect={() => {}}
      />,
    );
    const activeClass = screen.getByRole("button").className;
    // active 有無でクラス文字列が変わる。
    expect(activeClass).not.toBe(inactiveClass);
  });

  it("nextProgram があれば「次: …」を描画する", () => {
    render(
      <ChannelRow
        service={service}
        program={program}
        nextProgram={nextProgram}
        progress={0}
        active={false}
        onSelect={() => {}}
      />,
    );
    expect(
      screen.getByText(t("watch.select.next", { title: nextProgram.name! })),
    ).toBeTruthy();
  });

  it("nextProgram が無ければ「次: …」を描画しない", () => {
    render(
      <ChannelRow
        service={service}
        program={program}
        progress={0}
        active={false}
        onSelect={() => {}}
      />,
    );
    expect(screen.queryByText(/^次:/)).toBeNull();
  });
});
