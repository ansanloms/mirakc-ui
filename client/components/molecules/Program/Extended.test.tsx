import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ProgramExtended from "./Extended.tsx";
import { sampleProgram } from "../../../lib/fixtures.ts";
import type { components } from "../../../lib/api/schema.d.ts";

type Program = components["schemas"]["MirakurunProgram"];

describe("ProgramExtended", () => {
  it("program.extended の key / value を dt / dd で描画する", () => {
    const { container } = render(<ProgramExtended program={sampleProgram} />);
    // fixtures の sampleProgram は extended に「出演者」「音楽」を持つ。
    expect(screen.getByText("出演者")).toBeTruthy();
    expect(screen.getByText("山田太郎 / 佐藤花子 / 鈴木一郎")).toBeTruthy();
    expect(screen.getByText("音楽")).toBeTruthy();
    expect(container.querySelectorAll("dt").length).toBe(2);
    expect(container.querySelectorAll("dd").length).toBe(2);
  });

  it("extended が空 (undefined) のときは項目を描画しない", () => {
    const program = {
      ...sampleProgram,
      extended: undefined,
    } as unknown as Program;
    const { container } = render(<ProgramExtended program={program} />);
    expect(container.querySelectorAll("dt").length).toBe(0);
    expect(container.querySelectorAll("dd").length).toBe(0);
    // dl 自体は描画される。
    expect(container.querySelector("dl")).not.toBeNull();
  });
});
